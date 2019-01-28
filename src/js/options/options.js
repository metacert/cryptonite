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

    var optionsBetaProgramLink01 = '<a href="https://metacertprotocol.com/cryptonite-beta?via=cryptonite" class="cryptonite-extension-updated-description-link" target="_blank">' + $.i18n.getString("options_beta_program_hint_01_link") + '</a>';
    var optionsBetaProgramDescriptionText01 = $.i18n.getString("options_beta_program_hint_01", [optionsBetaProgramLink01]);
    $("#cryptonite-options-beta-program-text-01").html(optionsBetaProgramDescriptionText01);

    var optionsBetaProgramLink03_02 = '<a href="https://metacertprotocol.com/cryptonite-beta?via=cryptonite" class="cryptonite-extension-updated-description-link" target="_blank">' + $.i18n.getString("options_beta_program_hint_03_02_link") + '</a>';
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

    $('#cryptonite-purchase-registration-form').submit(function(aEvent) {
      aEvent.preventDefault();
      Options.submitPurchaseRegistrationData();
    });

    if(CryptoniteUtils.isExtensionPaid()) {
      var subscriptionData = PropertyDAO.get(PropertyDAO.PROP_SUBSCRIPTION_DATA);
      var planName = subscriptionData.planName;
      var subscriptionId = subscriptionData.subscriptionId;
      $("#cryptonite-purchase-registration-data-entry").hide();
      $("#cryptonite-purchase-registration-data-display").show();
      $("#options-purchase-registration-plan-name").text(planName);
      $("#options-purchase-registration-subscription-id").text(subscriptionId);
    } else {
      $("#cryptonite-purchase-registration-data-display").hide();
      $("#cryptonite-purchase-registration-data-entry").show();
    }
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
   * Sends the data to activate a purchase code.
   */
  submitPurchaseRegistrationData: function() {
    var subscriptionId = $('#cryptonite-purchase-registration-code').val();
    var data = { 'subid': subscriptionId };
    var callback = function(aIsCallSuccessful, aData) {
      console.log("aIsCallSuccessful", aIsCallSuccessful);
      console.log("aData", aData);
      $('#cryptonite-purchase-registration-code').val("");
      $("#cryptonite-purchase-registration-submit-button").removeAttr("disabled");
      $("#cryptonite-purchase-registration-submit-button .cryptonite-purchase-registration-loading-image").hide();
      $("#cryptonite-purchase-registration-submit-button #cryptonite-purchase-registration-submit-button-text").text(
        $.i18n.getString("options_purchase_registration_button_submit"));

      if(aIsCallSuccessful) {
        if("false" == aData.error || false == aData.error) {
          var planName = "";
          var subscriptionId = "";

          if("undefined" !== typeof aData.data.planName) {
            planName = aData.data.planName;
          }
          if("undefined" !== typeof aData.data.subscriptionId) {
            subscriptionId = aData.data.subscriptionId;
          }

          //if the code activation was successfull, let's make the whole Cryptonite addon appear activated
          $(".cryptonite-purchase-registration-error").css("visibility", "hidden");
          $("#cryptonite-purchase-registration-data-entry").hide();
          $("#cryptonite-purchase-registration-data-display").show();
          $("#options-purchase-registration-plan-name").text(planName);
          $("#options-purchase-registration-subscription-id").text(subscriptionId);

          //set the extension as paid and display the whole UI as extension active
          CryptoniteUtils.setExtensionPaid(aData);
        } else {
          //if the API call failed, let's display the message coming from the server
          $("#cryptonite-purchase-registration-data-display").hide();
          $("#cryptonite-purchase-registration-error-01").text(aData.message);
          $(".cryptonite-purchase-registration-error").css("visibility", "visible");
        }
      } else {
        //if the API call failed, let's display a generic message
        $("#cryptonite-purchase-registration-error-01").text(
          $.i18n.getString("options_purchase_registration_error_01"));
        $(".cryptonite-purchase-registration-error").css("visibility", "visible");
      }
    };

    $("#cryptonite-purchase-registration-submit-button").attr("disabled", "disabled");
    $("#cryptonite-purchase-registration-submit-button .cryptonite-purchase-registration-loading-image").show();
    $("#cryptonite-purchase-registration-submit-button #cryptonite-purchase-registration-submit-button-text").text(
      $.i18n.getString("options_beta_program_sending"));
    CryptoniteUtils.submitPurchaseCodeData(data, callback);
  },

  /**
   * Unitializes the object.
   */
  uninit : function() {
  }
};

$(document).ready(function() { Options.init(); });
