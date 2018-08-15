//if we don't have a browser object, check for chrome.
if (typeof chrome === 'undefined' && typeof browser !== 'undefined') {
  chrome = browser;
}

/**
 * @classdesc Background class for the addon.
 *
 * @class Background
 */
var Background = {
  lastUrl: 'about:blank',

  /**
   * Initiliazes the object.
   */
  _init : function() {
    PropertyDAO.init();
    //XXX: we want to always display the twitter annotations. We also hid the preference to turn the
    //twitter annotation on / off, so this preference needs to always be true.
    PropertyDAO.set(PropertyDAO.PROP_ENABLE_WEBSITE_ANNOTATIONS, true);
    //TODO: in case we need to force a new url to be removed from the access-anyway list,
    //we need to set the property PROP_IS_ACCESS_ANYWAY_FIX_APPLIED to a false value in here.
    PropertyDAO.set(PropertyDAO.PROP_IS_ACCESS_ANYWAY_FIX_APPLIED, false);
    CryptoniteUtils.setKnownDomainsRegExp();
  }
};

/**
 * Constructor.
 */
(function() { this._init(); }).apply(Background);

/**
 * Background script for tab update listening.
 */
chrome.tabs.onUpdated.addListener(function(aTabId, aChangeInfo, aTab) {
  if(aChangeInfo.status && "complete" === aChangeInfo.status && null !== aTab.url) {
    CryptoniteUtils.checkTab(aTab, true, false);
  }

  if(aChangeInfo.status && "loading" === aChangeInfo.status && null != aChangeInfo.url) {
    CryptoniteUtils.checkTab(aTab, true, true);
  }
});

/**
 * Checks whether a new version is installed or the current version is updated.
 *
 * @method "chrome.runtime.onInstalled.addListener"
 * @memberof Background
 */
chrome.runtime.onInstalled.addListener(function(aDetails) {
  if(aDetails.reason == "install" || aDetails.reason == "update") {
    CryptoniteUtils.removeFromAccessAnyway();
    if(aDetails.reason == "update") {
      PropertyDAO.set(PropertyDAO.PROP_DISPLAY_UPDATE_BANNER, true);
      PropertyDAO.set(PropertyDAO.PROP_UPDATE_BANNER_TAB_ID, -1);
    }
    if(aDetails.reason == "install") {
      CryptoniteUtils.openFirstRunPage();
    }

    var queryInfo = { };
    var callback = function(aTabs) {
      $.each(aTabs, function(aIndex, aTab) {
        if(!CryptoniteUtils.isLocalTab(aTab.url)) {
          CryptoniteUtils.checkTab(aTab, false, false);
        }
      });
    };
    chrome.tabs.query(queryInfo, callback);
  }
});

/**
 * Listens to events on browser startup.
 *
 * @method "chrome.runtime.onStartup.addListener"
 * @memberOf Background
 */
chrome.runtime.onStartup.addListener(function() {
  //let's clear the access-anyway list every time we start the browser
  PropertyDAO.set(PropertyDAO.PROP_ACCESS_ANYWAY_URLS_ARRAY, []);
});

/**
 * Listens to message passing from the content scripts.
 *
 * @method "chrome.runtime.onMessage.addListener"
 * @memberOf Background
 */
chrome.runtime.onMessage.addListener(function(aRequest, aSender, aSendResponse) {
  var responseObj = { };

  switch (aRequest.operation) {
    case 'closeAnnotationBanner':
      PropertyDAO.set(PropertyDAO.PROP_ENABLE_BANNER_ANNOTATION, false);
      var queryInfo = { };
      var extensionOptionsURL = CryptoniteUtils.getExtensionOptionsURL();
      var callback = function(aTabs) {
        responseObj.operation = 'enableAnnotations';
        responseObj.isBannerAnnotationEnabled =
          PropertyDAO.get(PropertyDAO.PROP_ENABLE_BANNER_ANNOTATION);
        responseObj.areWebsiteAnnotationsEnabled =
          PropertyDAO.get(PropertyDAO.PROP_ENABLE_WEBSITE_ANNOTATIONS);
        responseObj.areTwitterMentionsAnnotationsEnabled =
          PropertyDAO.get(PropertyDAO.PROP_ENABLE_TWITTER_MENTIONS_ANNOTATIONS);

        $.each(aTabs, function(aIndex, aTab) {
          if(aTab && "url" in aTab && aTab.url == extensionOptionsURL) {
            //refresh the options page
            chrome.tabs.reload(aTab.id);
          } else {
            //refresh the webpage and hide the green banner
            if(!CryptoniteUtils.isLocalTab(aTab.url)) {
              chrome.tabs.sendMessage(aTab.id, responseObj);
            }
          }
        });
      };
      chrome.tabs.query(queryInfo, callback);
      break;

    case 'updateBannerClosed':
      PropertyDAO.set(PropertyDAO.PROP_DISPLAY_UPDATE_BANNER, false);
      PropertyDAO.set(PropertyDAO.PROP_UPDATE_BANNER_TAB_ID, -1);
      break;

    case 'installBannerClosed':
      PropertyDAO.set(PropertyDAO.PROP_DISPLAY_INSTALL_BANNER, false);
      PropertyDAO.set(PropertyDAO.PROP_INSTALL_BANNER_TAB_ID, -1);
      break;

    case 'addAccessAnywayUrl':
      var accessAnywayUrlsArray = PropertyDAO.get(PropertyDAO.PROP_ACCESS_ANYWAY_URLS_ARRAY);
      var accessAnywayUrl = CryptoniteUtils.removeAccessAnywayParameter(aRequest.url);
      if(-1 == $.inArray(accessAnywayUrl, accessAnywayUrlsArray)) {
        accessAnywayUrlsArray.push(accessAnywayUrl);
        PropertyDAO.set(PropertyDAO.PROP_ACCESS_ANYWAY_URLS_ARRAY, accessAnywayUrlsArray);
      }
      break;

    case 'checkURL':
      var checkURLCallback = function(aResponse) {
        var urlType = CryptoniteUtils.getURLType(aResponse);
        responseObj = {};
        responseObj.nodeId = aRequest.nodeId;
        responseObj.url = aRequest.url;
        responseObj.operation = 'checkURL';
        responseObj.type = urlType;
        responseObj.isBannerAnnotationEnabled =
          PropertyDAO.get(PropertyDAO.PROP_ENABLE_BANNER_ANNOTATION);
        responseObj.areWebsiteAnnotationsEnabled =
          PropertyDAO.get(PropertyDAO.PROP_ENABLE_WEBSITE_ANNOTATIONS);
        responseObj.areTwitterMentionsAnnotationsEnabled =
          PropertyDAO.get(PropertyDAO.PROP_ENABLE_TWITTER_MENTIONS_ANNOTATIONS);

        chrome.tabs.sendMessage(aSender.tab.id, responseObj);
      };

      MetaCertApi.checkUrl(aRequest.url, ConfigSettings.METACERT_WEBSITE_INTERNAL_URL, checkURLCallback);
      break;
  }
  return true;
});
