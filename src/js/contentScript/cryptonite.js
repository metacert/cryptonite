/**
 * Content script class.
 */

//if we don't have a browser object, check for chrome.
if (typeof chrome === 'undefined' && typeof browser !== 'undefined') {
  chrome = browser;
}

/**
 * @classdesc Content script attached to the user webpage. Modifies the page content.
 *
 * @class Cryptonite
 */
function Cryptonite() {

  this.mutationObserver = null;
  this.rootElement = this.getRootElement();
  this.checkParams = null;
  this.debugActive = false;
  this.observerRoot = null;

  this.redShield = chrome.extension.getURL('images/red/cryptonite-icon-16x16.png');
  this.greenShield = chrome.extension.getURL('images/green/cryptonite-icon-16x16.png');
  this.blackShield = chrome.extension.getURL('images/black/cryptonite-icon-16x16.png');

  this.greenShieldCircular = chrome.extension.getURL('images/green/cryptonite-icon-circular-16x16.png');
  this.blackShieldCircular = chrome.extension.getURL('images/black/cryptonite-icon-circular-16x16.png');
}

Cryptonite.prototype = {

  constructor: Cryptonite,
  hostName: CryptoniteUtils.getDomain(window.location.hostname),
  firstLoad: true,
  siteId: '',

  /**
   * @description Logs debug messages, if the debug flag is set.
   *
   * @method debug
   * @memberof Cryptonite#
   * @param {String} aString the string to be logged to the console.
   */
  debug: function() {
    if (this.debugActive === true) {
      console.debug.apply(null, ['[MetaCert CheckThis] '].concat(arguments));
    }
  },

  /**
   * @description Extracts the domain for the website we are going to process.
   *
   * @method identifySite
   * @memberof Cryptonite#
   */
  identifySite: function() {
    if (self === top) {
      switch (this.hostName) {
        case 'facebook.com':
          this.siteId = 'facebook';
          break;
        case 'twitter.com':
          this.siteId = 'twitter';
          break;
        case 'yahoo.com':
          this.siteId = 'yahoo';
          break;
        case 'aol.com':
          this.siteId = 'aol';
          break;
        default:
          this.siteId = this.hostName;
          break;
      }

      this.debug('this.siteId: ', this.siteId);
    }
  },


  /**
   * @description Displays a banner over the first page opened after an extension update.
   *
   * @method forceUpdateBanner
   * @memberof Cryptonite#
   */
  forceUpdateBanner: function(aData, aSender, aSendResponse) {
    if(0 < $('.cryptonite-website-extension-updated-wrapper').length) {
      return;
    }

    var updatedAnnotation = cryptonite.getWebsiteExtensionUpdatedMarkup(aData);
    $(cryptonite.rootElement).prepend(updatedAnnotation);
    $('.cryptonite-website-extension-updated-wrapper').slideDown("fast", function() {
      $(this).css('display', 'inline-block');
    });

    //update the tabId where the banner has been displayed
    if(aSendResponse) {
      aSendResponse({tabId: aData.tabId});
    }
  },

  /**
   * @description Forces the display of the first install banner over a webpage.
   *
   * @method forceInstallBanner
   * @memberof Cryptonite#
   */
  forceInstallBanner: function() {
    //let's return if we have displayed a banner already
    if(0 < $('.cryptonite-website-extension-installed-wrapper').length ||
       0 < $('.cryptonite-website-extension-updated-wrapper').length) {
      return;
    }

    var installedAnnotation = cryptonite.getWebsiteExtensionInstalledMarkup();
    $(cryptonite.rootElement).prepend(installedAnnotation);
    $('.cryptonite-website-extension-installed-wrapper').slideDown("fast", function() {
      $(this).css('display', 'inline-block');
    });

  },

  /**
   * @description Displays a banner over the webpage.
   *
   * @method flagSite
   * @memberof Cryptonite#
   * @param {Object} aData the data coming from the MetaCert API that we will use to annotate the webapge.
   */
  flagSite: function(aData) {
    if(null === aData.type || false === CryptoniteUtils.shouldDisplayWebsiteBanner(aData.type)) {
      $('.cryptonite-website-annotation').remove();
      $('.cryptonite-website-annotation-shift').removeClass('cryptonite-website-annotation-shift');
      return;
    }

    if(aData.forceFlagRemove) {
      $('.cryptonite-website-annotation').remove();
    }

    if(0 < $('.cryptonite-website-annotation').length) {
      return;
    }

    var websiteAnnotation = cryptonite.getWebsiteAnnotationMarkup(aData);
    $(cryptonite.rootElement).prepend(websiteAnnotation);

    //let's hide the banner if the user does not want to display it
    cryptonite.toggleAnnotations(aData);
  },

  /**
   * @description Removes the top annotation banner.
   *
   * @method removeFlag
   * @memberof Cryptonite#
   */
  removeFlag: function() {
    $('.cryptonite-website-annotation-shift').removeClass('cryptonite-website-annotation-shift');
    $('.cryptonite-website-annotation').remove();
  },

  /**
   * @description Gets the annotation markup to annotate websites with the new designs.
   *
   * @method getWebsiteAnnotationMarkup
   * @memberof Cryptonite#
   * @param {Object} aData the data needed to create the website annotation.
   * @returns {Object} the annotation markup to annotate post with the new designs.
   */
  getWebsiteAnnotationMarkup: function(aData) {
    var annotation;
    var annotationDescriptionText = $.i18n.getString("website_annotation_" + aData.type.replace('-', '_'));
    var annotationCloseText = $.i18n.getString("website_annotation_close");
    var messageParameters = {
      'operation': 'closeAnnotationBanner'
    };

    annotation =  $('<div class="cryptonite-website-annotation' + ' cryptonite-' + aData.type  + ' cryptonite-website-annotation-wrapper">' +
                      '<div class="cryptonite-website-annotation-close-message">' + annotationCloseText + '</div>' +
                      '<span>' + annotationDescriptionText + '</span>' +
                    '</div>');

    $('.cryptonite-website-annotation-close-message', annotation).on('click', function() {
      cryptonite.closeAnnotations();
      chrome.runtime.sendMessage(null, messageParameters, null, function(aResponse) {
      });
    });

    return annotation;
  },

  /**
   * @description Gets the annotation markup to annotate a webpage.
   *
   * @method getWebsiteExtensionUpdatedMarkup
   * @memberof Cryptonite#
   * @param {Object} aData the data needed to create the banner.
   * @returns {Object} the annotation markup to annotate a webpage.
   */
  getWebsiteExtensionUpdatedMarkup: function(aData) {
    var annotation;
    var annotationTitleText = $.i18n.getString("website_annotation_extension_updated_title", [aData.extensionVersion]);
    var annotationDescriptionTextLink01 =
      '<a href="https://medium.com/@Paul__Walsh/protection-against-twitter-scams-b801b08fc3cc" class="cryptonite-extension-updated-description-link" target="_blank">' + $.i18n.getString("website_annotation_extension_updated_description_link_01") + '</a>';
    var annotationDescriptionTextLink02 =
      '<a href="https://t.me/metacert" class="cryptonite-extension-updated-description-link" target="_blank">' + $.i18n.getString("website_annotation_extension_updated_description_link_02") + '</a>';
    var annotationDescriptionText01 = $.i18n.getString("website_annotation_extension_updated_description_01");
    var annotationDescriptionText02 = $.i18n.getString("website_annotation_extension_updated_description_02", [annotationDescriptionTextLink02]);
    var cryptoniteImage = chrome.extension.getURL("images/metacert-logo-white.png");
    var closeMessageParameters = {
      'operation': 'updateBannerClosed'
    };

    annotation =
      $('<div class="cryptonite-website-extension-updated-wrapper cryptonite-annotation-extension-updated cryptonite-extension-updated">' +
          '<div class="cryptonite-website-extension-updated-content">' +
            '<div class="cryptonite-extension-updated-left"><img src="'+ cryptoniteImage +'"/></div>' +
            '<div class="cryptonite-extension-updated-right">' +
              '<div class="cryptonite-extension-updated-title">' + annotationTitleText + '</div>' +
              '<div class="cryptonite-extension-updated-description">' + annotationDescriptionText01 + '</div>' +
              '<div class="cryptonite-extension-updated-description">' + annotationDescriptionText02 + '</div>' +
            '</div>' +
            '<div class="cryptonite-extension-updated-close">&times;</div>' +
          '</div>' +
        '</div>');

    $('.cryptonite-extension-updated-close', annotation).on('click', function() {
      $(cryptonite.rootElement).removeClass('cryptonite-website-annotation-shift');
      $('.cryptonite-website-extension-updated-wrapper').slideUp("fast", function() {
        $('.cryptonite-website-extension-updated-wrapper').remove();
      });
      chrome.runtime.sendMessage(null, closeMessageParameters, null, function(aResponse) {
      });
    });

    return annotation;
  },

  /**
   * @description Gets the annotation markup to display a banner after the addon has been installed.
   *
   * @method getWebsiteExtensionInstalledMarkup
   * @memberof Cryptonite#
   * @returns {Object} the annotation markup to annotate a webpage with the install banner.
   */
  getWebsiteExtensionInstalledMarkup: function() {
    var annotation;
    var annotationTitleText = $.i18n.getString("website_annotation_extension_installed_title");
    var annotationDescriptionText01 = $.i18n.getString("website_annotation_extension_installed_description_01");
    var annotationDescriptionText02 = $.i18n.getString("website_annotation_extension_installed_description_02");
    var cryptoniteImage = chrome.extension.getURL("images/metacert-logo.png");
    var closeMessageParameters = {
      'operation': 'installBannerClosed'
    };

    annotation =
      $('<div class="cryptonite-website-extension-installed-wrapper cryptonite-annotation-extension-updated cryptonite-extension-updated">' +
          '<div class="cryptonite-website-extension-updated-content">' +
            '<div class="cryptonite-extension-updated-left"><img src="'+ cryptoniteImage +'"/></div>' +
            '<div class="cryptonite-extension-updated-right">' +
              '<div class="cryptonite-extension-updated-title">' + annotationTitleText + '</div>' +
              '<div class="cryptonite-extension-updated-description">' + annotationDescriptionText01 + '</div>' +
              '<div class="cryptonite-extension-updated-description">' + annotationDescriptionText02 + '</div>' +
            '</div>' +
            '<div class="cryptonite-extension-installed-close">&times;</div>' +
          '</div>' +
        '</div>');

    $('.cryptonite-extension-installed-close', annotation).on('click', function() {
      $(cryptonite.rootElement).removeClass('cryptonite-website-annotation-shift');
      $('.cryptonite-website-extension-installed-wrapper').slideUp("fast", function() {
        $('.cryptonite-website-extension-installed-wrapper').remove();
      });
      chrome.runtime.sendMessage(null, closeMessageParameters, null, function(aResponse) {
      });
    });

    return annotation;
  },

  /**
   * @description Closes the annotation banner on the page.
   *
   * @method closeAnnotations
   * @memberof Cryptonite#
   */
  closeAnnotations: function() {
    var data = {
      isBannerAnnotationEnabled: false,
    };
    cryptonite.toggleAnnotations(data);
  },

  /**
   * @description Toggles the webpage annotation banner on / off.
   *
   * @method toggleAnnotations
   * @memberof Cryptonite#
   * @param {Object} aData object that indicates if webpage annotations are on / off in the preferences.
   */
  toggleAnnotations: function(aData) {
    var isBannerAnnotationEnabled = aData.isBannerAnnotationEnabled;
    var areWebsiteAnnotationsEnabled = aData.areWebsiteAnnotationsEnabled;
    var areTwitterMentionsAnnotationsEnabled = aData.areTwitterMentionsAnnotationsEnabled;

    if(isBannerAnnotationEnabled) {
      $('.cryptonite-website-annotation').show();
    } else {
      $('.cryptonite-website-annotation').hide();
    }

    if(areWebsiteAnnotationsEnabled) {
      $('.cryptonite-link-annotation').show();
      if(!areTwitterMentionsAnnotationsEnabled) {
        $('.twitter-atreply .cryptonite-link-annotation').hide();
      }
    } else {
      $('.cryptonite-link-annotation').hide();
    }

    cryptonite.setWebsiteAnnotationShift(isBannerAnnotationEnabled);
  },

  /**
   * @description Adds or removes a margin-top to annotated webpages to make room to our website annotation.
   *
   * @method setWebsiteAnnotationShift
   * @memberof Cryptonite#
   * @param {Boolean} aAreAnnotationsEnabled indicates if webpage annotations are on / off in the preferences.
   */
  setWebsiteAnnotationShift: function(aAreAnnotationsEnabled) {
    if(aAreAnnotationsEnabled) {
      $(cryptonite.rootElement).addClass('cryptonite-website-annotation-shift');
    } else {
      $(cryptonite.rootElement).removeClass('cryptonite-website-annotation-shift');
    }
  },

  /**
   * @description Gets the root element to list for DOM changes.
   *
   * @method getRootElement
   * @memberof Cryptonite#
   */
  getRootElement: function() {
    //search header elements for twitter, faebook, slack, google
    var searchElement = $('.global-nav, #pagelet_bluebar, #client-ui, #searchform');
    var rootElement;

    if(0 < searchElement.length) {
      rootElement = searchElement[0];
    } else {
      rootElement = $('body');
    }

    return rootElement;
  },

  /**
   * @description Check internal links in a page to see if they should be annotated with the MetaCert API.
   *
   * @method checkPageInternally
   * @memberof Cryptonite#
   */
  checkPageInternally: function() {
    var messageParameters = {
      'operation': 'checkURL',
      'url': ''
    };
    var searchExpr = CryptoniteUtils.CHECK_INTERNALLY_DOMAINS_MAP[this.siteId];
    var nodeId;
    var url;

    $(searchExpr).each(function () {
        //avoid processing the link more than once
        if ($(this).attr('data-is-cryptonite-processed') === 'true' ||
            $(this).attr('data-is-cryptonite-flagged') === 'true') {
            return;
        }

        nodeId = CryptoniteUtils.getUUID();
        url = this.href;

        $(this).attr("nodecheckid", nodeId);
        $(this).attr('data-is-cryptonite-processed', true);

        if ("undefined" !== typeof(url) && null !== url &&  '' !== $.trim(url)) {
            //check with the MetaCert API about the url and its type: malware, phising, xxx, etc
            cryptonite.debug('Current link to process: ', url);
            messageParameters.url = url;
            messageParameters.nodeId = nodeId;
            chrome.runtime.sendMessage(null, messageParameters, null, function (aState) {
                // nothing to do here as the message is processed asynchronously
            });
        }
    });
  },

  /**
   * @description Scans for posts, turns on the observer, and scans again for more changes.
   *
   * @method observerExec
   * @memberof Cryptonite#
   */
  observerExec: function() {
    cryptonite.debug('observerExec');
    this.checkPageInternally();
    window.setTimeout(this.observe, 500);
  },

  /**
   * @description Turns on the mutation observer.
   *
   * @method observe
   * @memberof Cryptonite#
   */
  observe: function() {
    cryptonite.debug('observe', cryptonite.observerRoot);

    if (cryptonite.mutationObserver == null) {
      var timeline = document.querySelector(cryptonite.observerRoot);
      var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

      cryptonite.mutationObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'childList') {
            cryptonite.checkPageInternally();
          }
        });
      });

      cryptonite.mutationObserver.observe(timeline, {
        attributes: false,
        childList: true,
        characterData: true
      });
    }
  },

  /**
   * @description Main execution script. Starts the observation process in the root element.
   *
   * @method execute
   * @memberof Cryptonite#
   */
  execute: function() {
    cryptonite.mutationObserver = null;

    if (this.firstLoad === true) {
      this.identifySite();
      this.firstLoad = false;
    }

    if(this.siteId in CryptoniteUtils.CHECK_INTERNALLY_DOMAINS_MAP == false) {
      //XXX: for now, we will just annotate twitter accounts.
      return;
    }

    switch (this.siteId) {
      case 'twitter':

        if(0 < $('div.replies-to div.tweets-wrapper div.stream > ol.stream-items').length) {
          //listen for mutations on the twitter replies timeline
          cryptonite.observerRoot = "div.replies-to div.tweets-wrapper div.stream > ol.stream-items";
        } else {
          if(0 < $('div.stream > ol.stream-items').length) {
            //listen for mutations on the twitter timeline
            this.observerRoot = "div.stream > ol.stream-items";
          } else {
            //listen for mutations on the twitter followers section
            if(0 < $('div.GridTimeline-items').length) {
              this.observerRoot = "div.GridTimeline-items";
            }
          }
        }
        break;
    }

    this.observerExec();
  },

  /**
   * @description Adds the respective annotation to a link.
   *
   * @method annotateLink
   * @memberof Cryptonite#
   * @param {String} aNodeId the DOM node id to add the respective annotation.
   * @param {Object} aCheckResponse the MetaCert API response with the url check response.
   */
  annotateLink : function(aNodeId, aCheckResponse) {
    cryptonite.debug("----- ANNOTATING NODE -----", aNodeId);
    var annotation;
    var isAccountHeader = false;

    if(0 < $(aNodeId).parents(".stream-item-header").length) {
      isAccountHeader = true;
    }

    annotation = this.getAnnotationMarkup(aNodeId, isAccountHeader, aCheckResponse);

    if (0 < $(aNodeId).find(".username").length) {
      $(aNodeId).find(".username").prepend(annotation);
    } else {
      $(aNodeId).prepend(annotation);
    }

    cryptonite.debug("----- FINISHED ANNOTATING NODE -----", aNodeId);
  },

  /**
   * @description Gets the annotation markup to annotate links.
   *
   * @method getAnnotationMarkup
   * @memberof Cryptonite#
   * @param {String} aNodeId the DOM node id to add the respective annotation.
   * @param {Object} aCheckResponse the MetaCert API response with the url check response.
   *
   * @returns the annotation markup to annotate links.
   */
  getAnnotationMarkup: function(aNodeId, aIsAccountHeader, aCheckResponse) {
    var annotation;
    var title;
    var isVerifiedAccount;
    var flaggedResult = CryptoniteUtils.isFlaggedCategory(aCheckResponse.type.type);
    var shieldImage = this.blackShield;

    if(flaggedResult.isCryptoGoodCategory) {
      isVerifiedAccount = "";
      if(aIsAccountHeader) {
        shieldImage = this.greenShield;
      } else {
        shieldImage = this.greenShieldCircular;
      }
    } else {
      isVerifiedAccount = $.i18n.getString("website_annotation_account_not");
      if(aIsAccountHeader) {
        shieldImage = this.blackShield;
      } else {
        shieldImage = this.blackShieldCircular;
      }
    }

    title = $.i18n.getString("website_annotation_account", [isVerifiedAccount]);

    annotation = $('<span class="cryptonite-link-annotation"><img class="cryptonite-bells-image"></span>');
    annotation.children('.cryptonite-bells-image').attr('title', title);
    annotation.children('.cryptonite-bells-image').attr('src', shieldImage);

    if(!aCheckResponse.areWebsiteAnnotationsEnabled) {
      //let's hide the annotations if annotations are not enabled
      annotation.hide();
    } else {
      if($(aNodeId).hasClass('twitter-atreply') && !aCheckResponse.areTwitterMentionsAnnotationsEnabled) {
        //let's hide the twitter mentions
        annotation.hide();
      }
    }

    return annotation;
  }

};

/**
 * @description Listen for messages but only in the top frame.
 *
 * @method chrome.runtime.onMessage.addListener
 * @memberof Cryptonite#
 * @link https://developer.chrome.com/extensions/runtime#event-onMessage
 */
if (window.top === window) {
  var cryptonite = new Cryptonite();

  //start execution.
  $(document).ready(function() {
    //listen to DOM changes and annotate twitter accounts
    cryptonite.execute();

    $(".take-me-there-link").click(function(aEvent) {
      var url = null;
      var messageParameters;
      if(this.href && null != this.href && 0 < this.href.length) {
        url = this.href;
        messageParameters = {
          'operation': 'addAccessAnywayUrl',
          'url': url
        };
        chrome.runtime.sendMessage(null, messageParameters, null, function(aResponse) {
        });
      }
    });
  });

  chrome.runtime.onMessage.addListener(function(aMessage, aSender, aSendResponse) {
    switch (aMessage.operation) {
      case 'flagSite':
        cryptonite.flagSite(aMessage);
        break;

      case 'forceUpdateBanner':
        cryptonite.forceUpdateBanner(aMessage, aSender, aSendResponse);
        break;

      case 'removeFlag':
        cryptonite.removeFlag();
        break;

      case 'checkURL':
        cryptonite.debug("----- GOT THIS BACK FROM THE METACERT API -----", aMessage);

        var urlType = aMessage.type;
        if (null != urlType) {
          var nodeToFlagId = "[nodecheckid=" + aMessage.nodeId + "]";
          $(nodeToFlagId).attr('data-is-cryptonite-flagged', true);
          $(nodeToFlagId).attr('data-cryptonite-type', urlType.type);

          cryptonite.annotateLink($(nodeToFlagId), aMessage);

          cryptonite.debug("url: ", aMessage.url);
          cryptonite.debug("type: ", aMessage.type);
        }

        cryptonite.debug("----- END -----");
        cryptonite.debug("");
        break;

      case 'enableAnnotations':
        cryptonite.toggleAnnotations(aMessage);
        break;

      case 'forceInstallBanner':
        cryptonite.forceInstallBanner();
        break;

      case 'annotatePage':
        cryptonite.execute();
        break;
    }
    return true;
  });
}
