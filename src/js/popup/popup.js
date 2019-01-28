/**
 * @classdesc Handles all the logic for the pop up element on the addon.
 *
 * @class Popup
 */
var Popup = {

  /**
   * Initializes the object.
   */
  init : function() {
    var historyEmptyImage = CryptoniteUtils.getHistoryEmptyImage();
    var betaProgramUrl = CryptoniteUtils.getExtensionOptionsURL() + "?betaProgram=true";

    // Apply locale to the relevant nodes.
    $("[rel^=i18n],[title^=i18n],[data-val-required^=i18n],[placeholder^=i18n]").i18n({ attributeNames: [ "rel", "title", "data-val-required", "placeholder" ] });

    $('#cryptonite-go-to-options, #cryptonite-activate-license').click(function() {
      if("undefined" != typeof(browser)) {
        browser.runtime.openOptionsPage();
      } else {
        if("undefined" != typeof(chrome)) {
          // New way to open options pages, if supported (Chrome 42+).
          chrome.runtime.openOptionsPage();
        }
      }
    });

    $('#cryptonite-go-to-beta-program').click(function() {
      chrome.tabs.create({ url: betaProgramUrl });
    });

    $('#cryptonite-go-to-bookmarks').click(function() {
      $('#cryptonite-bookmarks-list').show();
      $('#cryptonite-options-list').hide();
      $('#cryptonite-history-list').hide();
    });

    $('#cryptonite-go-to-history').click(function() {
      $('#cryptonite-history-list').show();
      $('#cryptonite-options-list').hide();
      $('#cryptonite-bookmarks-list').hide();
    });

    $('.cryptonite-go-to-main-menu').click(function() {
      $('#cryptonite-options-list').show();
      $('#cryptonite-bookmarks-list').hide();
      $('#cryptonite-history-list').hide();
    });

    CryptoniteUtils.setRateUsLink();
    this.fillHistoryLinks();
    this.fixPopupClose();
    //use the corresponding favicon for each bookmark.
    $('.cryptonite-history-empty-image').attr('src', historyEmptyImage);
    //modify the pop up UI depending on the extension state: paid, trial active, trial expired.
    if(PropertyDAO.get(PropertyDAO.PROP_IS_EXTENSION_PAID)) {
      $('.cryptonite-trial-container').hide();
      $('.cryptonite-subscription-container').show();
    } else {
      $('.cryptonite-subscription-container').hide();
      $('.cryptonite-trial-container').show();
      if(CryptoniteUtils.isTrialActive()) {
        $(".cryptonite-trial-expired").hide();
        $(".cryptonite-trial-active").show();
      }
      else {
        $(".cryptonite-trial-active").hide();
        $(".cryptonite-trial-expired").show();
      }
    }

    $('.cryptonite-buy-now-button').click(function() {
      //we need to initiate the buying code from the background, because if we start on the pop up,
      //the callbacks are lost and not called by the Chrome pay api
      var buyExtensionParameters = {
        'operation': 'buyExtension'
      };
      chrome.runtime.sendMessage(null, buyExtensionParameters, null, function(aResponse) { });
    });
  },

  /**
   * Unitializes the object.
   */
  uninit : function() {
  },

  /**
   * Closes the pop up when the user clicks on a link.
   * On Firefox, the pop up menu stays open even if the user clicks on a link inside the pop up menu.
   */
  fixPopupClose: function() {
    $('#cryptonite-options-list a, #cryptonite-bookmarks-list a, #cryptonite-history-list a').click(function(aEvent) {
      if(!$(this).hasClass("cryptonite-go-to-main-menu") &&
         "cryptonite-go-to-bookmarks" != this.id &&
         "cryptonite-go-to-history" != this.id) {
        setTimeout(function() {
          window.close();
        }, 200);
      }
    });
  },

  /**
   * Fills the History section with cryptocurrency links visited by the user.
   */
  fillHistoryLinks: function() {
    var cryptocurrencyHistoryUrlsArray = PropertyDAO.get(PropertyDAO.PROP_CRYPTOCURRENCY_URLS_HISTORY_ARRAY);
    var arrayLength = (cryptocurrencyHistoryUrlsArray) ? cryptocurrencyHistoryUrlsArray.length : 0;
    var limit;
    var historyListItem;
    var i;

    if(arrayLength > ConfigSettings.METACERT_MAX_HISTORY_ITEMS) {
      limit = arrayLength - ConfigSettings.METACERT_MAX_HISTORY_ITEMS;
    } else {
      limit = 0;
    }

    if(0 < arrayLength) {
      $('#cryptonite-history-list-items').empty();
      $('#cryptonite-history-empty-list').hide();
      $('#cryptonite-history-list-items').show();

      for(i = arrayLength; i > limit; i--) {
        urlObject = cryptocurrencyHistoryUrlsArray[i - 1];
        historyListItem = CryptoniteUtils.getHistoryListItem(urlObject);
        $('#cryptonite-history-list-items').append(historyListItem);
      }
    } else {
      $('#cryptonite-history-list-items').hide();
      $('#cryptonite-history-empty-list').show();
    }
  }
};

$(document).ready(function() { Popup.init(); });
