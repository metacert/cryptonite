/**
 * @classdesc Utility functions needed by the front and backends of the extension.
 *
 * @class CryptoniteUtils
 */
var CryptoniteUtils = {

  defaultIcon: "/images/black/cryptonite-icon-128x128.png",
  cryptoGoodCategoryIcon: "/images/green/cryptonite-icon-128x128.png",
  accessAnywayCategoryIcon: "/images/red/cryptonite-icon-128x128.png",
  websiteDefaultFavicon: "images/green/cryptonite-icon-48x48.png",
  metaCertLogo: "images/metacert-logo.png",

  flaggedCategories: [
    'malware-phishing',
    'crypto-phish'
  ],

  cryptoGoodCategories: [
    'cryptocurrency'
  ],

  CHECK_INTERNALLY_DOMAINS_MAP: {
    "twitter" : '.js-user-profile-link, .ProfileCard-screennameLink, .twitter-atreply, .js-profile-popup-actionable'
  },

  removeProtocolRegExp: new RegExp(/^((https?:|)\/\/)?(www.)?/),
  localhostRegExp: new RegExp(/localhost/),
  validProtocolRegExp: new RegExp(/^https?$/),
  validPortRegExp: new RegExp(/^80$|^8080$/),
  ipAddressRegExp: new RegExp(/^[0-9]+(\.[0-9]+){3}$/),
  localTabRegExp: new RegExp(/^about:|^chrome-extension:|^moz-extension:/),
  knownDomainsRegExp: null,

  /**
   * Extracts the domain from an url.
   *
   * @param {String} aUrl the url from where to extract the domain.
   */
  url2Domain: function(aUrl) {
    if (aUrl) {
      aUrl = aUrl.toString().replace(/^(?:https?|ftp)\:\/\//i, '');
      aUrl = aUrl.toString().replace(/^www\./i, '');
      aUrl = aUrl.toString().replace(/\/.*/, '');
      return aUrl;
    }
  },

  /**
   * Returns a query string param by its name.
   *
   * @param {String} aName the name of the parameter to retrieve.
   * @param {String} aUrl the url from where to extract the parameter.
   * @returns {String} the value of the parameter in the url.
   */
  getParameterByName: function(aName, aUrl) {
    var result = null;
    if (!aUrl) {
      aUrl = window.location.href;
    }
    aName = aName.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + aName + "(=([^&#]*)|&|#|$)");
    var results = regex.exec(aUrl);

    if (!results) {
      //return null if the parameter doesn't exist in the url
      result = null;
    } else {
      if (!results[2]) {
        //return empty string if the parameter doesn't have a value in the url
        result = '';
      } else {
        //return the value of the parameter in the url
        result = decodeURIComponent(results[2].replace(/\+/g, " "));
      }
    }

    return result;
  },

  /**
   * Determines if a category returned by the MetaCert API should be flagged.
   *
   * @param {String} aType the MetaCert API response type, like 'cryptocurrency', 'crypto-phish', 'fake-news', etc.
   */
  isFlaggedCategory: function(aType) {
    var result = {
      isFlaggedCategory: false,
      isCryptoGoodCategory: false
    };

    if(-1 < $.inArray(aType, CryptoniteUtils.flaggedCategories)) {
      result.isFlaggedCategory = true;
    }

    if(-1 < $.inArray(aType, CryptoniteUtils.cryptoGoodCategories)) {
      result.isCryptoGoodCategory = true;
    }

    return result;
  },

  /**
   * Determines if we should display a banner for good crypto webites.
   *
   * @param {String} aType the MetaCert API response type, like 'cryptocurrency', 'crypto-phish', 'fake-news', etc.
   */
  shouldDisplayWebsiteBanner: function(aType) {
    var shouldDisplayWebsiteBanner = false;

    if(-1 < $.inArray(aType, CryptoniteUtils.cryptoGoodCategories)) {
      shouldDisplayWebsiteBanner = true;
    }

    return shouldDisplayWebsiteBanner;
  },

  /**
   * Opens a new tab with the block page, including the blocked url as parameter.
   *
   * @param {String} aTabId the id of the tab to be redirected to the block page.
   * @param {String} aBlockedUrl the blocked url to be shown in the block page.
   */
  showBlockPage : function(aTabId, aArguments) {
    var targetUrl = CryptoniteUtils.setUrlArguments(ConfigSettings.METACERT_BLOCKPAGE, aArguments);
    chrome.tabs.update(aTabId, {url: targetUrl});
  },

  /**
   * Sets arguments in an url with argument placeholders, like http://mysite.com/?param1=#{PARAM1}&param2=#{PARAM2}

   * @param {String} aUrl the url with the argument placeholders.
   * @param {Object} aArguments an object with key / value pair representations of the arguments, like param1=#{PARAM1} .
   * @returns {String} the url with the parameters filled with proper values.
   */
  setUrlArguments: function (aUrl, aArguments) {
    var argRE;

    $.each(aArguments, function(aIndex, aValue) {
      if ("undefined" === typeof (aValue) || null === aValue) {
        aValue = "";
      }

      argRE = new RegExp("#{" + aIndex + "}", "gi");
      aUrl = aUrl.replace(argRE, aValue);
    });

    return aUrl;
  },

  /**
   * Gets the type of the URL (fake-news, satire, phishing-malware, etc.).
   *
   * @param {Object} aResponse the response object from the MetaCert API call.
   * @returns {Object} an object with the url type and where the type was found: domains || folders || urls
   */
  getURLType : function(aResponse) {
    var type = null;
    var placeFound = null;
    var domains = null;
    var folders = null;
    var urls = null;
    var response = {
      type: null,
      placeFound: null,
    };

    if (aResponse) {
        domains = aResponse.Domains;
        folders = aResponse.Folders;
        urls = aResponse.URLs;

        if (urls && null != urls && 0 < urls.length) {
          type = urls[0].type;
          placeFound = "urls";
        } else {
          if (folders && null != folders && 0 < folders.length) {
            type = folders[0].type;
            placeFound = "folders";
          } else {
            if (domains && null != domains && 0 < domains.length && domains[0] != "social-networks") {
              type = domains[0].type;
              placeFound = "domains";
            }
          }
        }
    }

    response.type = type;
    response.placeFound = placeFound;

    return response;
  },

  /**
   * Determines if the result from the MetaCert API contains a social media account, like twitter.com/theonion.
   *
   * @param {String} aType the MetaCert API response type, like 'cryptocurrency', 'crypto-phish', 'fake-news', etc.
   * @returns {Boolean} a flag that indicates if the url belongs to a social media account or not.
   */
  isSocialMediaAccount: function(aType) {
    return null != aType && aType === 'social-networks';
  },

  /**
   * Sets the badge color to green if the site is type 'cryptocurrency'.
   * If the site is type 'crypto-pish' then the user is redirected to a safe website.
   *
   * @param {Object} aResponse the response object from the MetaCert API call.
   * @param {Tab} aTab the tab object that is being examinated.
   * @param {Boolean} aIsPageLoad indicates if the user loaded the page:
   * true = user loaded the page, false = the page was reloaded automatically.
   * @param {Boolean} aIsPageLoading indicates if the page is being loaded.
   * We want to avoid making a redirect if the page is still loading.
   * For Firefox, if we execute a redirect while the page is loading,
   * we enter into a load / redirect loop with non predictable results.
   */
  setCryptoWebsiteResult: function(aResponse, aTab, aIsPageLoad, aIsPageLoading) {
    var flaggedResult = CryptoniteUtils.isFlaggedCategory(aResponse.type);
    var details = {
      'path': null,
      'tabId': null
    };
    var parameters = {
      'domain': encodeURIComponent(aTab.url),
      'redirect': encodeURIComponent(Background.lastUrl)
    };
    var tooltipDetails = {
      'title': null,
      'tabId': null
    };
    //set the icon or redirect only if we have a valid tab.id
    if("undefined" !== typeof(aTab.id) && null !== aTab.id) {
      if (flaggedResult.isFlaggedCategory && !aIsPageLoading) {
        //let's avoid a page redirect if we are still loading the soon-to-be-blocked webpage
        CryptoniteUtils.showBlockPage(aTab.id, parameters);
      } else {
        if (flaggedResult.isCryptoGoodCategory) {
          details.path = CryptoniteUtils.cryptoGoodCategoryIcon;
          tooltipDetails.title = $.i18n.getString("button_openPopup_green",
            [ $.i18n.getString("button_openPopup_verify_" + aResponse.placeFound) ]);

          //addd the cryptocurrency url to a history list of visited cryptocurrency urls
          if(aIsPageLoad) {
            CryptoniteUtils.addCryptocurrencyUrlToHistory(aTab);
          }
        } else {
          details.path = CryptoniteUtils.defaultIcon;
          tooltipDetails.title = $.i18n.getString("button_openPopup_black");
        }
        details.tabId = aTab.id;
        chrome.browserAction.setIcon(details, null);

        //set the icon tooltip
        tooltipDetails.tabId = aTab.id;
        chrome.browserAction.setTitle(tooltipDetails);

        //handle the case of blank pages before going to a blocked url
        if("undefined" == typeof(aTab.url) || null === aTab.url || aTab.url === "" ||
           "chrome://newtab/" == decodeURIComponent(aTab.url) ||
           "about:newtab" == decodeURIComponent(aTab.url) ) {
          aTab.url = "about:blank";
        }
        Background.lastUrl = aTab.url;
      }
    }
  },

  /**
   * Checks the tab and its url to flag it or redirect the website.
   *
   * @param {Tab} aTab the tab object that is being examinated.
   * @param {Boolean} aIsPageLoad indicates if the user loaded the page:
   * true = user loaded the page, false = the page was reloaded automatically.
   * @param {Boolean} aIsPageLoading indicates if the page is being loaded.
   * We want to avoid making a redirect if the page is still loading.
   * For Firefox, if we execute a redirect while the page is loading,
   * we enter into a load / redirect loop with non predictable results.
   */
  checkTab: function(aTab, aIsPageLoad, aIsPageLoading) {
    var responseObj = {};
    var domainParts = null;
    var protocol = null;
    var domain = null;
    var port = null;
    var accessAnyway = false;
    var url;

    var checkCallback = function(aResponse) {
      if (aResponse) {
        var urlType = CryptoniteUtils.getURLType(aResponse);
        var type = urlType.type;
        var placeFound = urlType.placeFound;
        var shouldDisplayWebsiteBanner = CryptoniteUtils.shouldDisplayWebsiteBanner(type);

        responseObj = {};
        responseObj.url = aTab.url;
        responseObj.type = type;
        responseObj.placeFound = placeFound;
        responseObj.isBannerAnnotationEnabled =
          PropertyDAO.get(PropertyDAO.PROP_ENABLE_BANNER_ANNOTATION);
        responseObj.areWebsiteAnnotationsEnabled =
          PropertyDAO.get(PropertyDAO.PROP_ENABLE_WEBSITE_ANNOTATIONS);
        responseObj.areTwitterMentionsAnnotationsEnabled =
          PropertyDAO.get(PropertyDAO.PROP_ENABLE_TWITTER_MENTIONS_ANNOTATIONS);

        if (shouldDisplayWebsiteBanner) {
          responseObj.operation = 'flagSite';
          responseObj.forceFlagRemove = true;
          responseObj.closedBanners = Background.closedBanners;
        } else {
          responseObj.operation = 'removeFlag';
        }
        if(!CryptoniteUtils.isLocalTab(aTab.url)) {
          chrome.tabs.sendMessage(aTab.id, responseObj);
        }

        CryptoniteUtils.setCryptoWebsiteResult(responseObj, aTab, aIsPageLoad, aIsPageLoading);

        if(aIsPageLoad && !aIsPageLoading) {
          responseObj.operation = 'annotatePage';
          chrome.tabs.sendMessage(aTab.id, responseObj);
        }
      }
    };

    domainParts = CryptoniteUtils.extractDomain(aTab.url);
    protocol = domainParts.protocol;
    domain = domainParts.domain;
    port = domainParts.port;

    CryptoniteUtils.forceUpdateBanner(aTab, aIsPageLoad);
    CryptoniteUtils.forceInstallBanner(aTab, aIsPageLoad);
    //for an url, let's check if the protocol, domain and port is valid.
    //also let's skip the API call if the domain is an IP addres.
    if(CryptoniteUtils.canProcessDomain(protocol, domain, port)) {
      //XXX: from here we removed the call to the isGoodCryptoDomain method because there are some
      //domains that have gone from "good crypto" to malware-phishing (hacked domains).
      var isKnownDomain = CryptoniteUtils.isKnownDomain(domain);
      if(!isKnownDomain) {
        accessAnyway = CryptoniteUtils.checkAccessAnywayUrl(aTab);
        if(!accessAnyway && aTab.url) {
          url = aTab.url.toLowerCase();
          MetaCertApi.checkUrl(url, null, ConfigSettings.METACERT_ADDRESS_BAR_URL, checkCallback);
        }
      }
    } else {
      if(CryptoniteUtils.isPreferencesUrl(aTab.url)) {
        CryptoniteUtils.forceGreenIconDisplay(aTab);
      }
    }
  },

  /**
   * Gets the domain from an url.
   *
   * @param {String} aUrl the url from where to extract the domain.
   * @returns {String} the domain extracte from the url.
   */
  getDomain: function(aUrl) {
    var domain = null;

    if("undefined" !== typeof(aUrl) && null !== aUrl) {
      domain = aUrl;
      domain = domain.replace(CryptoniteUtils.removeProtocolRegExp, '');
      domain = domain.toLowerCase();
      domain = CryptoniteUtils.url2Domain(domain);
    }

    return domain;
  },

  /**
   * Checks if a domain is on the list of good crypto websites.
   *
   * @param {String} aDomain the domain to check on the cache list of good crypto websites.
   * @returns {Boolean} true if the domain is on the cache list of good crypto websites, false otherwise.
   */
  isGoodCryptoDomain: function(aDomain) {
    var isGoodCryptoDomain = false;
    if(0 <= $.inArray(aDomain, ConfigSettings.GOOD_CRYPTO_DOMAINS_ARRAY)) {
      isGoodCryptoDomain = true;
    }

    return isGoodCryptoDomain;
  },

  /**
   * Checks if a domain is on the list of known websites.
   *
   * @param {String} aDomain the domain to check in the cache of knwon websites.
   * @returns {Boolean} true if the domain is on the list of known websites, false otherwise.
   */
  isKnownDomain: function(aDomain) {
    var isKnownDomain = true;
    if("undefined" != typeof(aDomain) && null != aDomain && 0 < aDomain.length) {
      isKnownDomain = CryptoniteUtils.knownDomainsRegExp.test(aDomain);
    }

    return isKnownDomain;
  },

  /**
   * Checks if a domain is on the list of domains to check internally for annotations.
   * We will only annotate websites that are on this list of "check internally".
   *
   * @param {String} aDomain the domain to check in the list of check internally domains.
   * @returns {Boolean} true if the domain is on the list of "check internally" websites, false otherwise.
   */
  isCheckInternallyDomain: function(aDomain) {
    var isCheckInternallyDomain = true;
    if("undefined" != typeof(aDomain) && null != aDomain && 0 < aDomain.length) {
      isCheckInternallyDomain = ConfigSettings.CHECK_INTERNALLY_DOMAINS_MAP[aDomain] != null;
    }

    return isCheckInternallyDomain;
  },

  /**
   * Checks if an url is on the list of access anyway websites.
   * The access anyway websites list contains all those urls that the user has accepted to open,
   * even after the addon determined that the url should be blocked because of its category.
   *
   * @param {Tab} aTab the tab object from where we extract the url to check and also where we set the icon red if needed.
   * @returns {Boolean} true if the domain is on the list of "access anyway" urls, false otherwise.
   */
  checkAccessAnywayUrl: function(aTab) {
    var result = false;
    var accessAnywayUrlsArray = PropertyDAO.get(PropertyDAO.PROP_ACCESS_ANYWAY_URLS_ARRAY);
    var accessAnywayUrl = CryptoniteUtils.removeAccessAnywayParameter(aTab.url);

    if(-1 < $.inArray(accessAnywayUrl, accessAnywayUrlsArray)) {
      //let's force the icon to turn red and skip calling the API if the domain is on the cache of "access anyway" domains
      CryptoniteUtils.forceDomainLabel(aTab, "access-anyway");
      result = true;
    } else {
      result = false;
    }

    return result;
  },

  /**
   * Extracts the domain from an url.
   *
   * @param {String} aUrl to url to extract the domain from.
   * @returns {Object} a result object with the protocol, domain and port extracted from the url.
   */
  extractDomain: function(aUrl) {
    var protocol = null;
    var domain = null;
    var port = null;
    var result = {
      protocol: null,
      domain: null,
      port: null
    };
    var urlParts;

    //let's use lowercase only
    aUrl = aUrl.toLowerCase();
    //find & remove protocol (http, ftp, etc.) and get domain
    if (aUrl.indexOf("://") > -1) {
      urlParts = aUrl.split('/');
      protocol = urlParts[0].replace(":", "");
      domain = urlParts[2];
    }
    else {
      domain = aUrl.split('/')[0];
    }

    //find & remove port number
    urlParts = domain.split(':');
    domain = urlParts[0];
    if("undefined" != typeof(urlParts[1])) {
      port = urlParts[1];
    }

    //find & remove "?"
    domain = domain.split('?')[0];
    //find & remove "#"
    domain = domain.split('#')[0];
    //find & remove "www."
    domain = domain.replace('www.', '');

    result.protocol = protocol;
    result.domain = domain;
    result.port = port;

    return result;
  },

  /**
   * Extracts the twitter username from an url.
   *
   * @param {String} aUrl to url to extract the twitter username from.
   * @returns {String} the twitter username, like https://twitter.com/metacert.
   */
  extractTwitterUsernameUrl: function(aUrl) {
    var urlParts = [];
    var usernameParts = [];
    var username = "";
    var result = "";

    //let's use lowercase only
    aUrl = aUrl.toLowerCase();
    if (aUrl.indexOf("twitter.com") > -1) {
      if(aUrl.endsWith("/")) {
        //remove the last "/"
        aUrl = aUrl.substring(0, aUrl.length - 1);
      }
      urlParts = aUrl.split('twitter.com');

      if("undefined" !== typeof(urlParts[1])) {
        //extract the twitter username from the url
        usernameParts = urlParts[1].split("/");

        if("undefined" !== typeof(usernameParts[1])) {
          username = usernameParts[1];
          if("i" !== username && "#" !== username && !username.startsWith("search?")) {
            result = urlParts[0] + "twitter.com" + "/" +  username;
          } else {
            result = null;
          }
        } else {
          result = null;
        }
      } else {
        result = null;
      }
    }
    else {
      result = null;
    }

    return result;
  },

  /**
   * Forces adding a banner to the active tab after the extension has been updated.
   *
   * @param {Tab} aTab the tab object that contains the information of the tab where we will place the update banner.
   * @param {Boolean} aIsPageLoad indicates if the user loaded the page.
   * true = user loaded the page, false = the page was reloaded automatically.
   */
  forceUpdateBanner: function(aTab, aIsPageLoad) {
    var localCallback = null;
    var tabId = PropertyDAO.get(PropertyDAO.PROP_UPDATE_BANNER_TAB_ID);
    var responseObj = {};
    responseObj.extensionVersion = ConfigSettings.EXTENSION_VERSION;
    responseObj.operation = 'forceUpdateBanner';
    responseObj.tabId = aTab.id;

    //let's display the update banner only if we have updated the extension
    //we will only process page loads done by the user and not automatically by the browser.
    //When you reload a Firefox extension, the contentscripts are automatically reloaded and we want to avoid displaying the banner in all tabs
    if(PropertyDAO.get(PropertyDAO.PROP_DISPLAY_UPDATE_BANNER) && aIsPageLoad) {
      //we will display the banner on the first tab to reload after the extension has been updated
      if(tabId == -1 || tabId == aTab.id) {
        //if we executed a page reload then we add the banner and keep the tabId to know which tab has displayed the update banner
        if(aIsPageLoad) {
          localCallback = function(aData) {
            if(aData && "tabId" in aData) {
              PropertyDAO.set(PropertyDAO.PROP_UPDATE_BANNER_TAB_ID, aData.tabId);
            }
          };
        }

        //we havent' displayed the banner yet, so let's display it on the current tab.
        //or we have already displayed the banner on this specific tab, so let's display it again
        if(!CryptoniteUtils.isLocalTab(aTab.url)) {
          chrome.tabs.sendMessage(aTab.id, responseObj, null, localCallback);
        }
      }
    }
  },

  /**
   * Forces adding a banner to the first run page after the extension has been installed.
   *
   * @param {Tab} aTab the tab object that contains the information of the tab where we will place the install banner.
   * @param {Boolean} aIsPageLoad indicates if the user loaded the page.
   * true = user loaded the page, false = the page was reloaded automatically.
   */
  forceInstallBanner: function(aTab, aIsPageLoad) {
    var responseObj = { };
    if(PropertyDAO.get(PropertyDAO.PROP_DISPLAY_INSTALL_BANNER) &&
       PropertyDAO.get(PropertyDAO.PROP_INSTALL_BANNER_TAB_ID) == aTab.id &&
       aIsPageLoad) {
      responseObj.operation = "forceInstallBanner";
      if(!CryptoniteUtils.isLocalTab(aTab.url)) {
        chrome.tabs.sendMessage(aTab.id, responseObj);
      }
    }
  },

  /**
   * Forces adding the green banner and green shield when a domain is on the cache.
   *
   * @param {Tab} aTab the tab object that contains the information for the labeled domain.
   * @param {String} aType the MetaCert API response type, like 'cryptocurrency', 'crypto-phish', 'fake-news', etc.
   * @param {Boolean} aIsPageLoad indicates if the user loaded the page.
   * true = user loaded the page, false = the page was reloaded automatically.
   */
  forceDomainLabel: function(aTab, aType, aIsPageLoad) {
    var responseObj = {};
    var details = {};
    var tooltipDetails = {};
    var placeFound = "domains";

    responseObj.url = aTab.url;
    responseObj.forceFlagRemove = true;
    details.tabId = aTab.id;
    tooltipDetails.tabId = aTab.id;
    if(0 <= aTab.url.indexOf('twitter.com')) {
      placeFound = "folders";
    }

    switch(aType) {
      case "cryptocurrency":
        responseObj.operation = 'flagSite';
        responseObj.type = 'cryptocurrency';
        responseObj.isBannerAnnotationEnabled =
          PropertyDAO.get(PropertyDAO.PROP_ENABLE_BANNER_ANNOTATION);
        responseObj.areWebsiteAnnotationsEnabled =
          PropertyDAO.get(PropertyDAO.PROP_ENABLE_WEBSITE_ANNOTATIONS);
        responseObj.areTwitterMentionsAnnotationsEnabled =
          PropertyDAO.get(PropertyDAO.PROP_ENABLE_TWITTER_MENTIONS_ANNOTATIONS);
        responseObj.closedBanners = Background.closedBanners;
        if(!CryptoniteUtils.isLocalTab(aTab.url)) {
          chrome.tabs.sendMessage(aTab.id, responseObj);
        }

        details.path = CryptoniteUtils.cryptoGoodCategoryIcon;
        tooltipDetails.title = $.i18n.getString("button_openPopup_green",
          [ $.i18n.getString("button_openPopup_verify_" + placeFound) ]);

        //addd the cryptocurrency url to a history list of visited cryptocurrency urls
        if(aIsPageLoad) {
          CryptoniteUtils.addCryptocurrencyUrlToHistory(aTab);
        }
      break;

      default:
        details.path = CryptoniteUtils.defaultIcon;
        tooltipDetails.title = $.i18n.getString("button_openPopup_black");
        break;
    }

    chrome.browserAction.setIcon(details, null);
    chrome.browserAction.setTitle(tooltipDetails);

    Background.lastUrl = aTab.url;
  },

  /**
   * Forces the green icon to be displayed next to the address bar.
   * This method is used when we need to force the green icon appear on the addon Preferences page.
   *
   * @param {Tab} aTab the tab object that is being examinated.
   */
  forceGreenIconDisplay: function(aTab) {
    var details = {};
    var tooltipDetails = {};
    var placeFound = "domains";

    details.tabId = aTab.id;
    details.path = CryptoniteUtils.cryptoGoodCategoryIcon;
    tooltipDetails.title = $.i18n.getString("button_openPopup_green",
        [ $.i18n.getString("button_openPopup_verify_" + placeFound) ]);
    chrome.browserAction.setIcon(details, null);
    chrome.browserAction.setTitle(tooltipDetails);
  },

  /**
   * Determines if the protocol in the url is valid.
   * We will only process urls with http and htpps protocols.
   *
   * @param {String} aProtocol the protocol to test.
   * @returns {Boolean} true if the protocol is valid (http or https), false otherwise.
   */
  isValidProtocol: function(aProtocol) {
    var isValidProtocol = true;
    if("undefined" != typeof(aProtocol) && null != aProtocol && 0 < aProtocol.length) {
      isValidProtocol = CryptoniteUtils.validProtocolRegExp.test(aProtocol);
    }

    return isValidProtocol;
  },

  /**
   * Determines if the port in the url is valid.
   * We will only process urls with 80 or 8080 ports (or null port which defaults to 80).
   *
   * @param {String} aPort the port to test.
   * @returns {Boolean} true if the port is valid (80 or 8080), false otherwise.
   */
  isValidPort: function(aPort) {
    var isValidPort = true;
    if("undefined" != typeof(aPort) && null != aPort && 0 < aPort.length) {
      isValidPort = CryptoniteUtils.validPortRegExp.test(aPort);
    }

    return isValidPort;
  },

  /**
   * Determines if the domain is an IP address.
   * We will only process urls that are not IP address.
   *
   * @param {String} aDomain the domain to test.
   * @returns {Boolean} true if the domain is an IP address, false otherwise.
   */
  isIPAddress: function(aDomain) {
    var isIPAddress = false;
    if("undefined" != typeof(aDomain) && null != aDomain && 0 < aDomain.length) {
      isIPAddress = CryptoniteUtils.ipAddressRegExp.test(aDomain);
    }

    return isIPAddress;
  },

  /**
   * Determines if the domain is a localhost address.
   * We will only process urls that are not localhost address.
   *
   * @param {String} aDomain the domain to test.
   * @returns {Boolean} true if the domain is a localhost address, false otherwise.
   */
  isLocalhostDomain: function(aDomain) {
    var isLocalhostDomain = false;
    if("undefined" != typeof(aDomain) && null != aDomain) {
      isLocalhostDomain = CryptoniteUtils.localhostRegExp.test(aDomain);
    }

    return isLocalhostDomain;
  },

  /**
   * Determines if the url is from a local address, like about:config or
   * chrome-extension://[extension-id]/html/options/options.html.

   * @param {String} aUrl the url to test.
   * @returns {Boolean} true if the url is from a local address, false otherwise.
   */
  isLocalTab: function(aUrl) {
    var isLocalTab = false;
    if(aUrl && 0 < aUrl.length) {
      isLocalTab = CryptoniteUtils.localTabRegExp.test(aUrl);
    }

    return isLocalTab;
  },

  /**
   * Determines if the url is from the Preferences tab on the extension.
   *
   * @param {String} aUrl the url to test.
   * @returns {Boolean} true if the url is from the Preferences tab, false otherwise.
   */
  isPreferencesUrl: function(aUrl) {
    var isPreferencesUrl = false;
    var isLocalTab = false;
    var preferencesUrl = CryptoniteUtils.getExtensionOptionsURL();

    if(aUrl && 0 < aUrl.length) {
      if(0 < aUrl.indexOf("#")) {
        aUrl = aUrl.substring(0, aUrl.indexOf("#"));
      }

      isLocalTab = CryptoniteUtils.localTabRegExp.test(aUrl);
      if(isLocalTab && 0 <= aUrl.indexOf(preferencesUrl)) {
        isPreferencesUrl = true;
      }
    }

    return isPreferencesUrl;
  },

  /**
   * Creates a regex that contains all the known domains from the list.
   */
  setKnownDomainsRegExp: function() {
    var knownDomainsRegExp;
    //let's only match domains but not subdomains, so we check chrome.google.com but no google.com
    var knownDomainsRegExpFirstPart = "^";
    //use negative lookahead to restrict anything found after the domain name.
    //We will discard domains like google111.com.
    var knownDomainsRegExpLastPart = "(?![a-zA-Z0-9-]+)(\\.[a-zA-Z0-9-]+)*";

    if(null == CryptoniteUtils.knownDomainsRegExp) {
      knownDomainsRegExp = "".concat(
        knownDomainsRegExpFirstPart,
        "(",
        ConfigSettings.KNOWN_DOMAINS_ARRAY_REG_EXP.join("|").replace(/\./g, "\\.").toLowerCase(),
        ")",
        knownDomainsRegExpLastPart);

      try {
        CryptoniteUtils.knownDomainsRegExp = new RegExp(knownDomainsRegExp, "i");
      } catch (ex) {
        //this regex matches nothing and we will need to call the API
        CryptoniteUtils.knownDomainsRegExp = new RegExp(/[]/);
      }
    }
  },

  /**
   * Determines if we can call the MetaCert API with the given url.
   *
   * @param {String} aProtocol the protocol to test.
   * @param {String} aDomain the domain to test.
   * @param {String} aPort the port to test.
   * @returns {Boolean} true if we can call the MetaCert API with the given url, false otherwise.
   */
  canProcessDomain: function(aProtocol, aDomain, aPort) {
    var canProcessDomain = false;
    canProcessDomain = CryptoniteUtils.isValidProtocol(aProtocol) &&
      CryptoniteUtils.isValidPort(aPort) &&
      !CryptoniteUtils.isIPAddress(aDomain) &&
      !CryptoniteUtils.isLocalhostDomain(aDomain);

    return canProcessDomain;
  },

  /**
   * Removes the access-anyway parameter from the url.
   *
   * @param {String} aUrl the url from where we will remove the parameter.
   */
  removeAccessAnywayParameter: function(aUrl) {
    var url = aUrl;
    url = url.replace("?access-anyway=true", "");
    url = url.replace("&access-anyway=true", "");
    url = url.replace("access-anyway=true", "");

    return url;
  },

  /**
   * Fixes a bug where the twitter.com domain was classified as phising by the API and added to the access-anyway list by accident.
   */
  removeFromAccessAnyway: function() {
    var accessAnywayUrlsArray = PropertyDAO.get(PropertyDAO.PROP_ACCESS_ANYWAY_URLS_ARRAY);
    var accessAnywayNewUrlsArray = [];
    var removeFromAccessAnywayArray = ConfigSettings.REMOVE_FROM_ACCESS_ANYWAY_ARRAY;

    if(!PropertyDAO.get(PropertyDAO.PROP_IS_ACCESS_ANYWAY_FIX_APPLIED) && $.isArray(accessAnywayUrlsArray)) {
      $.each(accessAnywayUrlsArray, function(aIndex, aValue) {
        if(-1 == $.inArray(aValue, removeFromAccessAnywayArray)) {
          accessAnywayNewUrlsArray.push(aValue);
        }
      });
      PropertyDAO.set(PropertyDAO.PROP_ACCESS_ANYWAY_URLS_ARRAY, accessAnywayNewUrlsArray);
      PropertyDAO.set(PropertyDAO.PROP_IS_ACCESS_ANYWAY_FIX_APPLIED, true);
    }
  },

  /**
   * Opens a welcome page in a new tab after the user installs the extension.
   */
  openFirstRunPage : function() {
    var firstRunURL = ConfigSettings.METACERT_FIRST_RUN_PAGE;

    if (PropertyDAO.get(PropertyDAO.PROP_FIRST_RUN_PAGE_DISPLAYED)) {
      return;
    }

    chrome.tabs.create({ url: firstRunURL, active: true }, function(aTab) {
      PropertyDAO.set(PropertyDAO.PROP_FIRST_RUN_PAGE_DISPLAYED, true);
    });
  },

  /**
   * Opens a page in a new tab after the user updates the extension.
   */
  openExtensionUpdatePage : function() {
    var extensionUpdateURL = ConfigSettings.METACERT_UPDATE_BETA_PAGE;

    chrome.tabs.create({ url: extensionUpdateURL, active: true }, function(aTab) {
    });
  },

  /**
   * Builds a history item based on the url visited by the user.
   *
   * @param {Object} aUrlObject the object that contains url visited by the user and the favicon for the visited url.
   * @returns {Object} the HTML markup for a history item based on the url visited by the user.
   */
  getHistoryListItem: function(aUrlObject) {
    var displayUrl = aUrlObject.url.replace(CryptoniteUtils.removeProtocolRegExp, '');
    var listItem =
      '<li>' +
        '<a href="' + aUrlObject.url + '" target="_blank">' +
          '<img class="cryptonite-favicon-image" src=' + aUrlObject.favicon + '></img>' +
          '<span>' + displayUrl + '</span>' +
        '</a>' +
      '</li>';

    return listItem;
  },

  /**
   * Finds an item inside an array that matches a property / value pair.
   * For example, we will search for url="http://mywebsite.com" in an array of objects of type
   * { url: "http://mywebsite.com", favicon: "http://mywebsite.com/favicon.ico" } .
   *
   * @param {Array} aArray the array where we will execute the search.
   * @param {String} aProperty the property name that we will search for.
   * @param {String} aValue the value of the property that we want to match.
   * @returns {Integer} the index where the object was found in the array, or -1 if no match was found.
   */
  findInArrayByProperty: function(aArray, aProperty, aValue) {
    var index = -1;
    var i;
    for(i = 0; i < aArray.length; i++) {
      if (aArray[i] && aArray[i][aProperty] === aValue) {
        return i;
      }
    }
    return index;
  },

  /**
   * Adds a cryptocurrency url to the list of visited cryptocurrency urls.
   *
   * @param {Tab} aTab the tab that contains the url to add to the list of visited cryptocurrency urls.
   */
  addCryptocurrencyUrlToHistory: function(aTab) {
    var cryptocurrencyHistoryUrlsArray = PropertyDAO.get(PropertyDAO.PROP_CRYPTOCURRENCY_URLS_HISTORY_ARRAY);
    var index = CryptoniteUtils.findInArrayByProperty(cryptocurrencyHistoryUrlsArray, "url", aTab.url);
    var favicon;
    var urlObject = { };
    var maxArrayItems = ConfigSettings.METACERT_MAX_HISTORY_ITEMS_IN_ARRAY * -1;

    if(aTab.favIconUrl && 0 < aTab.favIconUrl.length) {
      favicon = aTab.favIconUrl;
    } else {
      //use the MetaCert icon by default
      favicon = chrome.extension.getURL(CryptoniteUtils.websiteDefaultFavicon);
    }
    urlObject.url = aTab.url;
    urlObject.favicon = favicon;

    if(-1 < index) {
      cryptocurrencyHistoryUrlsArray.splice(index, 1);
    }
    cryptocurrencyHistoryUrlsArray.push(urlObject);

    //let's limit the quantity of history objects to a fixed amount so the array does not grow too big.
    //we will keep only the last 20 recorded urls for crypto websites.
    cryptocurrencyHistoryUrlsArray = cryptocurrencyHistoryUrlsArray.slice(maxArrayItems);
    PropertyDAO.set(PropertyDAO.PROP_CRYPTOCURRENCY_URLS_HISTORY_ARRAY, cryptocurrencyHistoryUrlsArray);
  },

  /**
   * Gets the url for the Options page.
   *
   * @returns {String} the url for the Options page.
   */
  getExtensionOptionsURL: function() {
    var extensionOptionsUrl = chrome.extension.getURL("html/options/options.html");
    return extensionOptionsUrl;
  },

  /**
   * Gets the path for the image on the empty history section.
   *
   * @returns {String} the path for the image on the empty history section.
   */
  getHistoryEmptyImage: function() {
    var historyEmptyImage;
    var browserName = ConfigSettings.BROWSER_NAME;
    switch(browserName) {
      case "safari":
        historyEmptyImage = safari.extension.baseURI + CryptoniteUtils.metaCertLogo;
        break;
      default:
        historyEmptyImage = chrome.extension.getURL(CryptoniteUtils.metaCertLogo);
        break;
    }

    return historyEmptyImage;
  },

  /**
   * Sets the correct "Rate Us" link, depending on the browser.
   */
  setRateUsLink: function() {
    var browserName = ConfigSettings.BROWSER_NAME;

    switch(browserName) {
      case "firefox":
        //use AMO website link.
        $('#cryptonite-rate-us').attr('href', ConfigSettings.METACERT_RATE_US_FIREFOX);
        break;
      case "opera":
      case "blink":
        //use the Opera webstore link.
        $('#cryptonite-rate-us').attr('href', ConfigSettings.METACERT_RATE_US_OPERA);
        break;
      default:
        //use Chrome webstore link.
        $('#cryptonite-rate-us').attr('href', ConfigSettings.METACERT_RATE_US_CHROME);
        break;
    }
  },

  /**
   * Generates an unique ID similar to UUID.
   *
   * @returns {String} the generated id.
   */
  getUUID: function() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  },

  /**
   * Sends the data to subscribe to the Metacert Beta Program.
   *
   * @param {Object} aData the data to be sent to the subscription API. In this case we only send the user's email.
   * @param {Function} aCallback the callback to call after we send the data to the subscription API.
   */
  submitSubscriptionData: function(aData, aCallback) {
    MetaCertApi.submitSubscriptionData(aData, aCallback);
  }
};
