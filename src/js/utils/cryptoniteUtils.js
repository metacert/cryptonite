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
    'red',
  ],

  cryptoGoodCategories: [
    'green'
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
    if("undefined" == typeof(aArguments.redirect) || null === aArguments.redirect || "" === aArguments.redirect) {
      aArguments.redirect = "about:blank";
    }

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

        //only add an url after the page has completely loaded
        if(!aIsPageLoading) {
          Background.lastUrl = aTab.url;
        }
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

    //if the user has not paid or the trial has expired, we will not flag any website
    if(!CryptoniteUtils.canUseExtension()) {
      var trialExpiredTooltip = $.i18n.getString("button_openPopup_trial_expired");
      CryptoniteUtils.setBrowserActionStyleForTab(
        ConfigSettings.BADGE_BACKGROUND_RED, ConfigSettings.BADGE_TOOLTIP_EXCLAMATION,
        trialExpiredTooltip, CryptoniteUtils.defaultIcon, aTab);
      return;
    }

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
      if(0 < ConfigSettings.KNOWN_DOMAINS_ARRAY_REG_EXP.length) {
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
      } else {
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
  },

  /**
   * Sends the data to check for the purchase code entered by teh user.
   *
   * @param {Object} aData the data to be sent to the purchase API. In this case we only send the purchase code.
   * @param {Function} aCallback the callback to call after we send the data to the purchase API.
   */
  submitPurchaseCodeData: function(aData, aCallback) {
    MetaCertApi.submitPurchaseCodeData(aData, aCallback);
  },

  /**
   * Sets the trial dates for the extension.
   */
  setTrialDates: function() {
    console.log("setting trial dates");

    //trial number of days
    var trialDays = parseInt(ConfigSettings.TRIAL_DAYS);
    //trial ends in TRIAL_DAYS amount of days
    var trialDaysMilliseconds = trialDays * 86400000;
    //trial start
    var currentTimestamp = Date.now();

    if (null == PropertyDAO.get(PropertyDAO.PROP_TRIAL_START_DATE)) {
      PropertyDAO.set(PropertyDAO.PROP_TRIAL_START_DATE, currentTimestamp);
      //display a badge to indicate the expiration of the trial period after ConfigSettings.TRIAL_DAYS days
      setTimeout(function() {
        PropertyDAO.set(PropertyDAO.PROP_IS_TRIAL_ACTIVE, false);
        if(!CryptoniteUtils.isExtensionPaid()) {
          CryptoniteUtils.setTrialExpired();
        }
      }, trialDaysMilliseconds);
    } else {
      var trialEndTimestamp = PropertyDAO.get(PropertyDAO.PROP_TRIAL_START_DATE) + trialDaysMilliseconds;
      if(currentTimestamp > trialEndTimestamp &&
         !CryptoniteUtils.isExtensionPaid()) {
        CryptoniteUtils.setTrialExpired();
      }
    }
  },

  /**
   * Sets the trial period as expired.
   */
  setTrialExpired: function() {
    var trialExpiredTooltip = $.i18n.getString("button_openPopup_trial_expired");
    PropertyDAO.set(PropertyDAO.PROP_IS_TRIAL_ACTIVE, false);
    CryptoniteUtils.setBrowserActionStyle(
      ConfigSettings.BADGE_BACKGROUND_RED, ConfigSettings.BADGE_TOOLTIP_EXCLAMATION,
      trialExpiredTooltip, CryptoniteUtils.defaultIcon);
  },

  /**
   * Resets the trial expiration to give users more free time of the extension.
   */
  resetTrialExpired: function() {
    var tooltip = $.i18n.getString("button_openPopup_black");
    PropertyDAO.set(PropertyDAO.PROP_IS_TRIAL_ACTIVE, true);
    CryptoniteUtils.setBrowserActionStyle(null, "", tooltip, null);
  },

  /**
   * Checks if the extension trial is active.
   *
   * @returns {Boolean} true if the trial on the extension is active, false otherwise.
   */
  isTrialActive: function() {
    return PropertyDAO.get(PropertyDAO.PROP_IS_TRIAL_ACTIVE);
  },

  /**
   * Checks if the extension has been paid on the Chrome webstore, by retrieving the flag on the localstorage.
   *
   * @returns {Boolean} true if the extension has been paid on the Chrome webstore, false otherwise.
   */
  isExtensionPaid: function() {
    return PropertyDAO.get(PropertyDAO.PROP_IS_EXTENSION_PAID);
  },

  /**
   * Determines if the user can use the extension, being either on a paid subscription or an active trial.
   *
   * @returns {Boolean} true if the extension can be used, false otherwise.
   */
  canUseExtension: function() {
    var canUseExtension = false;
    if(CryptoniteUtils.isExtensionPaid() || CryptoniteUtils.isTrialActive()) {
      canUseExtension = true;
    }

    return canUseExtension;
  },

  /*
   * Checks if the extension has been paid on the Chrome webstore.
   *
   * @param {Function} aCallback the callback to call after we check if the extension has been paid on the Chrome webstore.
   */
  getExtensionPurchases: function(aShouldDisplayThankYouPage, aCallback) {
    //call the inapp purchases ONLY if we are on the Chrome browser,
    //because that API only works for Chrome and will produce errors on other browsers.
    if("chrome" !== ConfigSettings.BROWSER_NAME) {
      if(aCallback) {
        aCallback();
      }
    } else {
      google.payments.inapp.getPurchases({
        'parameters': {'env': 'prod'},
        'success': function(aResponse) {
          CryptoniteUtils.getPurchasesSuccess(aResponse, aShouldDisplayThankYouPage, aCallback);
        },
        'failure': function(aResponse) {
          CryptoniteUtils.getPurchasesError(aResponse, aCallback);
        }
      });
    }
  },

  /**
   * Process the data after getting all the purchases done by the user.
   *
   * @param {Object} aResponse the response from the server with all the purchases done by the user.
   */
  getPurchasesSuccess: function(aResponse, aShouldDisplayThankYouPage, aCallback) {
    var paymentSource = CryptoniteUtils.getPaymentSource();
    var tempResponse = '{ "response": { "details": [ { "kind": "chromewebstore#payment", "itemId": "1234567", "sku": "metacert_yearly_subscription", "createdTime": "1387221267248", "state": "ACTIVE" } ] } }';
    //aResponse = JSON.parse(tempResponse);
    var shouldCallStripeCheck = true;

    console.log(" +++ getPurchases SUCCESS +++ ");
    console.log(aResponse);
    if(0 < aResponse.response.details.length) {
      $.each(aResponse.response.details, function(aIndex, aValue) {
        console.log("item: ", aValue);
        //check if the user has paid for the extension
        if(ConfigSettings.METACERT_WEBSTORE_PLAN_ID == aValue.sku) {
          if(ConfigSettings.METACERT_WEBSTORE_PLAN_ACTIVE == aValue.state &&
             ConfigSettings.PAYMENT_SOURCE_STRIPE !== paymentSource) {
            //set the extension as paid and display the whole UI as extension active
            shouldCallStripeCheck = false;
            CryptoniteUtils.setExtensionPaid();
            if(aShouldDisplayThankYouPage) {
              CryptoniteUtils.displayThankYouPage();
            }
          } else {
            //the Google payment has expired
            if(ConfigSettings.PAYMENT_SOURCE_STRIPE !== paymentSource) {
              //reset the extension state if there is no previous Stripe payment
              CryptoniteUtils.setExtensionUnpaid();
            }
          }
        }
      });
    }

    if(shouldCallStripeCheck && aCallback) {
      aCallback();
    }
  },

  /**
   * Process the data after getting an error when retrieving all the purchases done by the user.
   *
   * @param {Object} aResponse the response from the server with all the purchases done by the user.
   */
  getPurchasesError: function(aResponse, aCallback) {
    console.log(" +++ getPurchases FAILURE +++ ");
    console.log(aResponse);

    if(aCallback) {
      aCallback();
    }
  },

  /**
   * Buys a subscription for the Cryptonite addon.
   * The buying user is the user that is logged in on the Chrome websites at the moment of the purchase.
   */
  buyCryptoniteExtension: function() {
    google.payments.inapp.buy({
      'parameters': {'env': 'prod'},
      'sku': ConfigSettings.METACERT_WEBSTORE_PLAN_ID,
      'success': CryptoniteUtils.onPurchaseSuccess,
      'failure': CryptoniteUtils.onPurchaseFailure
    });
  },

  /**
   * Callback to be called after the user has paid for the extension.
   *
   * @param {Object} aResponse the response from the server with the purchase information.
   */
  onPurchaseSuccess: function(aResponse) {
    console.log(" +++ onPurchase SUCCESS +++ ");
    console.log(aResponse);
    //remove all badges
    var tooltip = $.i18n.getString("button_openPopup_black");
    CryptoniteUtils.setBrowserActionStyle(null, "", tooltip, null);
    PropertyDAO.set(PropertyDAO.PROP_IS_EXTENSION_PAID, true);
    console.log("Your payment has been completed. Thank you");
    CryptoniteUtils.displayThankYouPage();
  },

  /**
   * Callback to be called when there are errors after the user tried to pay for the extension.
   *
   * @param {Object} aResponse the response from the server with the purchase error information.
   */
  onPurchaseFailure: function(aResponse) {
    console.log(" +++ onPurchaseFail FAILURE +++ ");
    console.log(aResponse);
    CryptoniteUtils.getExtensionPurchases(true);
  },

  /**
   * Displays a thank you page after a purchase.
   */
  displayThankYouPage: function() {
    var width = 400;
    var height = 360;
    var left = (screen.width - width) / 2;
    var top = (screen.height - height) / 4;
    var windowSettings = "width = " + width + ", height = " + height + ", top =  " + top + ", left = " + left;
    var thankYouPageURL = chrome.extension.getURL('html/popup/thankYou.html');
    var generator = window.open(thankYouPageURL,'Thank You', windowSettings);
    generator.document.close();
  },

  /**
   * Sets the style for the extension icon in the address bar.
   *
   * @param {Object} aColor the color for the badge.
   * @param {Object} aBadgeText the text for the badge.
   * @param {Object} aTooltip the tooltip for the extension icon.
   * @param {Object} aIconPath the path for the extension icon.
   */
  setBrowserActionStyle: function(aColor, aBadgeText, aTooltip, aIconPath) {
    var callback = function(aTabs) {
      $.each(aTabs, function(aIndex, aTab) {
        CryptoniteUtils.setBrowserActionStyleForTab(aColor, aBadgeText, aTooltip, aIconPath, aTab);
      });
    };
    chrome.tabs.query({ }, callback);
  },

  /*
   * Sets the style for the extension icon in the address bar, for a specific tab.
   *
   * @param {Object} aColor the color for the badge.
   * @param {Object} aBadgeText the text for the badge.
   * @param {Object} aTooltip the tooltip for the extension icon.
   * @param {Object} aIconPath the path for the extension icon.
   */
  setBrowserActionStyleForTab: function(aColor, aBadgeText, aTooltip, aIconPath, aTab) {
    if (null !== aColor) {
      chrome.browserAction.setBadgeBackgroundColor({
        tabId: aTab.id,
        color: aColor
      });
    }

    if(null !== aBadgeText) {
      chrome.browserAction.setBadgeText({
        tabId: aTab.id,
        text: aBadgeText
      });
    }

    if(null !== aTooltip) {
      chrome.browserAction.setTitle({
        tabId: aTab.id,
        title: aTooltip
      });
    }

    if(null !== aIconPath) {
      chrome.browserAction.setIcon({
        tabId: aTab.id,
        path: aIconPath
      });
    }
  },

  /**
   * Sets the extension as "paid" and stores the subscription values.
   *
   * @argument {Object} aData the subscription data.
   */
  setExtensionPaid: function(aData) {
    CryptoniteUtils.setBrowserActionStyle(null, "", null, null);
    PropertyDAO.set(PropertyDAO.PROP_IS_EXTENSION_PAID, true);
    if("undefined" !== typeof(aData)) {
      //TODO: remove this line of code when Kamrul adds that key on the server response.
      aData.data.paymentSource = ConfigSettings.PAYMENT_SOURCE_STRIPE;
      PropertyDAO.set(PropertyDAO.PROP_SUBSCRIPTION_DATA, aData.data);
      ConfigSettings.SUBSCRIPTION_TYPE = aData.data.planType;
      console.log("You bought " + aData.data.planName + ". You have paid for the extension");
    } else {
      var data = {
        hasUsed: true,
        planName: ConfigSettings.DEFAULT_PLAN_NAME,
        planTerm: ConfigSettings.DEFAULT_PLAN_TERM,
        planType: ConfigSettings.DEFAULT_SUBSCRIPTION_TYPE,
        status: ConfigSettings.DEFAULT_SUBSCRIPTION_STATUS,
        subscriptionId: ConfigSettings.DEFAULT_SUBUSCRIPTION_ID,
        paymentSource: ConfigSettings.PAYMENT_SOURCE_GOOGLE
      };
      PropertyDAO.set(PropertyDAO.PROP_SUBSCRIPTION_DATA, data);
      ConfigSettings.SUBSCRIPTION_TYPE = ConfigSettings.DEFAULT_SUBSCRIPTION_TYPE;
      console.log("--- Thanks. You have paid for the extension ---");
    }
  },

  /*
   * Sets the extension as "paid = false" and modifies the UI accordingly.
   * The unpaid status will be set if the status of the subscription on Stripe is different than "active".
   */
  setExtensionUnpaid: function() {
    PropertyDAO.set(PropertyDAO.PROP_IS_EXTENSION_PAID, false);
    if(CryptoniteUtils.isTrialActive()) {
     CryptoniteUtils.resetTrialExpired();
    } else {
      CryptoniteUtils.setTrialExpired();
    }
  },

  /**
   * Checks daily for the subscription status on Stripe.
   */
  setDailyStatusCheck: function() {
    var subscriptionData = { };
    var data = { };
    var status;
    var lookupFrecuencyMilliseconds = ConfigSettings.LOOKUP_DAYS * 86400000;
    var stripeCheckCallback = function(aIsCallSuccessful, aData) {
      if(aIsCallSuccessful && false == aData.error) {
        status = aData.data.status;
        if(ConfigSettings.DEFAULT_SUBSCRIPTION_STATUS == status) {
          CryptoniteUtils.setExtensionPaid(aData);
        } else {
          CryptoniteUtils.setExtensionUnpaid();
        }
      }
    };

    var stripeCheck = function() {
      subscriptionData = PropertyDAO.get(PropertyDAO.PROP_SUBSCRIPTION_DATA);
      if("subscriptionId" in subscriptionData) {
        data.subid = subscriptionData.subscriptionId;
        MetaCertApi.checkExtensionStatus(data, stripeCheckCallback);
      }
    };

    setInterval(function() {
      CryptoniteUtils.getExtensionPurchases(false, stripeCheck);
    }, lookupFrecuencyMilliseconds);
  },

  /**
   * Gets the payment source: Google Pay: 'google' or Stripe payments: 'stripe'.
   *
   * @returns {String} the payment source: Google Pay: 'google' or Stripe payments: 'stripe'.
   */
  getPaymentSource: function() {
    var paymentSource = null;
    var subscriptionData = PropertyDAO.get(PropertyDAO.PROP_SUBSCRIPTION_DATA);
    if("paymentSource" in subscriptionData) {
      paymentSource = subscriptionData.paymentSource;
    }

    return paymentSource;
  }
};
