/**
 * @classdesc Handles all the logic for the Preferences on the addon.
 *
 * @class Options
 */
var Options = {

  /**
   * Elements that the user can change in the Preferences page
   */
  _CHECKBOX_PROPERTY_NAMES: [
    "PROP_ENABLE_BANNER_ANNOTATION",
    "PROP_ENABLE_WEBSITE_ANNOTATIONS",
    "PROP_ENABLE_TWITTER_MENTIONS_ANNOTATIONS"
  ],

  /**
   * Initializes the object.
   */
  init : function() {
    // Apply locale to the relevant nodes.
    $("[rel^=i18n],[title^=i18n],[data-val-required^=i18n],[placeholder^=i18n]").i18n({ attributeNames: [ "rel", "title", "data-val-required", "placeholder" ] });
    this._populateProperties();
    this._addEventListeners();
    CryptoniteUtils.setRateUsLink();

    //set the links on the Preferences page
    var optionsMetaTokensLink01 = '<a href="https://telegram.org" class="cryptonite-extension-updated-description-link" target="_blank">' + $.i18n.getString("options_metatokens_link_01") + '</a>';
    var optionsMetaTokensLink02 = '<a href="https://t.me/metacert" class="cryptonite-extension-updated-description-link" target="_blank">' + $.i18n.getString("options_metatokens_link_02") + '</a>';
    var optionsMetaTokensDescriptionText03 = $.i18n.getString("options_metatokens_hint_03", [optionsMetaTokensLink01, optionsMetaTokensLink02]);
    $("#cryptonite-options-metatokens-text-03").html(optionsMetaTokensDescriptionText03);

    var optionsBetaProgramLink01 = '<a href="https://metacertprotocol.com/beta" class="cryptonite-extension-updated-description-link" target="_blank">' + $.i18n.getString("options_beta_program_hint_01_link") + '</a>';
    var optionsBetaProgramDescriptionText01 = $.i18n.getString("options_beta_program_hint_01", [optionsBetaProgramLink01]);
    $("#cryptonite-options-beta-program-text-01").html(optionsBetaProgramDescriptionText01);

    var optionsBetaProgramLink03_02 = '<a href="https://metacertprotocol.com/beta" class="cryptonite-extension-updated-description-link" target="_blank">' + $.i18n.getString("options_beta_program_hint_03_02_link") + '</a>';
    var optionsBetaProgramDescriptionText03_02 = $.i18n.getString("options_beta_program_hint_03_02", [optionsBetaProgramLink03_02]);
    $("#cryptonite-options-beta-program-text-03_02").html(optionsBetaProgramDescriptionText03_02);

    var parameters = window.location.search;
    if("undefined" !== typeof(parameters) && null !== parameters && -1 < parameters.indexOf('betaProgram')) {
      //display the Beta Program tab on the Preferences page
      $('.cryptonite-prefs-page-content').hide();
      $('#cryptonite-menu li').removeClass('cryptonite-selected');
      $('#cryptonite-beta-program').addClass('cryptonite-selected');
      //XXX: on Firefox the Beta Program content sometimes remained hidden,
      //so we add a small delay and then display the content
      setTimeout(function() {
        $('#cryptonite-beta-program-wrapper').show();
      });
    }

    $('#cryptonite-beta-program-form').submit(function(aEvent) {
      aEvent.preventDefault();
      Options.submitSubscriptionData();
    });
  },

  /**
   * Populates properties.
   */
  _populateProperties: function () {

    $.each(this._CHECKBOX_PROPERTY_NAMES, function () {
      var propValue = PropertyDAO.get(PropertyDAO[this]) ? "_HIGHLIGHT" : "_IGNORE";

      $("#" + this + propValue).prop("checked", "checked");

      $("input[name='" + this + "']").change(function(e){
        Options._setProperty(this);
        Options._enableAnnotations(this);
      });
    });

  },

  /**
   * Adds event listeners
   */
  _addEventListeners : function() {
    $('#cryptonite-menu li').click(function() {
      var leftMenuItemId = $(this).attr('id');
      var prefPageContentId = '#' + leftMenuItemId + '-wrapper';

      $('.cryptonite-prefs-page-content').hide();
      $('#cryptonite-menu li').removeClass('cryptonite-selected');
      $(this).addClass('cryptonite-selected');
      $(prefPageContentId).show();
    });
  },

  /**
   * Sets a property on the browser preferences system.
   *
   * @param {Object} aElement the element to be set on the browser preferences system.
   */
  _setProperty: function (aElement) {
    var propName = PropertyDAO[$(aElement).attr("name")];
    if($(aElement).val() == 'highlight') {
      PropertyDAO.set(propName, true);
    } else {
      PropertyDAO.set(propName, false);
    }
  },

  /**
   * Toggles annotations on the websites.
   *
   * @param {Object} aElement the element that contains the toogle value. In this case, the element is a checkbox that determines if the annotations should be enabled or disabled.
   */
  _enableAnnotations: function(aElement) {

    var propValue = false;
    if($(aElement).val() == 'highlight') {
      propValue = true;
    }

    var annotationType = PropertyDAO[$(aElement).attr("name")];
    annotationType = annotationType.replace("general.enable.", "");
    annotationType = annotationType.replace(".annotations", "");
    annotationType = annotationType.replace(".", "-");

    var responseObj = { };
    var queryInfo = { };
    var callback = function(aTabs) {
      responseObj.operation = 'enableAnnotations';
      responseObj.annotationTypeEnabled = propValue;
      responseObj.annotationType = annotationType;
      responseObj.isBannerAnnotationEnabled =
        PropertyDAO.get(PropertyDAO.PROP_ENABLE_BANNER_ANNOTATION);
      responseObj.areWebsiteAnnotationsEnabled =
        PropertyDAO.get(PropertyDAO.PROP_ENABLE_WEBSITE_ANNOTATIONS);
      responseObj.areTwitterMentionsAnnotationsEnabled =
        PropertyDAO.get(PropertyDAO.PROP_ENABLE_TWITTER_MENTIONS_ANNOTATIONS);
      $.each(aTabs, function(aIndex, aTab) {
        //refresh the webpage and toggle the green banner and the annotations
        if(!CryptoniteUtils.isLocalTab(aTab.url)) {
          chrome.tabs.sendMessage(aTab.id, responseObj);
        }
      });
    };
    chrome.tabs.query(queryInfo, callback);

    if("PROP_ENABLE_WEBSITE_ANNOTATIONS" == $(aElement).attr("name")) {
      $('[name="PROP_ENABLE_TWITTER_MENTIONS_ANNOTATIONS"]').attr('disabled', !propValue);
    }
  },

  /**
   * Sends the data to subscribe to the Metacert Beta Program.
   */
  submitSubscriptionData: function() {
    var email = $('#cryptonite-beta-program-email').val();
    var data = { 'email': email };
    var url = ConfigSettings.METACERT_BETA_PROGRAM_SUBSCRIPTION_CONFIRMATION_PAGE;
    var callback = function(aIsSubscriptionSuccessful) {
      $('#cryptonite-beta-program-email').val("");
      $("#cryptonite-beta-program-submit-button").removeAttr("disabled");
      $("#cryptonite-beta-program-submit-button .cryptonite-beta-program-loading-image").hide();
      $("#cryptonite-beta-program-submit-button #cryptonite-beta-program-submit-button-text").text(
        $.i18n.getString("options_beta_program_submit"));

      if(aIsSubscriptionSuccessful) {
        $('.cryptonite-beta-program-form-results-error').hide();
        $('.cryptonite-beta-program-form-results-success').show();
        chrome.tabs.create({ url: url, active: true }, function(aTab) {
        });
      } else {
        $('.cryptonite-beta-program-form-results-success').hide();
        $('.cryptonite-beta-program-form-results-error').show();
      }
    };

    $("#cryptonite-beta-program-submit-button").attr("disabled", "disabled");
    $("#cryptonite-beta-program-submit-button .cryptonite-beta-program-loading-image").show();
    $("#cryptonite-beta-program-submit-button #cryptonite-beta-program-submit-button-text").text(
      $.i18n.getString("options_beta_program_sending"));
    CryptoniteUtils.submitSubscriptionData(data, callback);
  },

  /**
   * Unitializes the object.
   */
  uninit : function() {
  }
};

$(document).ready(function() { Options.init(); });
