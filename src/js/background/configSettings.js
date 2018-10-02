/**
 * @classdesc Class that is used to call the MetaCert API to check for url and retrieve their categories from the API.
 *
 * @class ConfigSettings
 */
var ConfigSettings = {

  _extension_version: null,
  _browser_name: null,

  /**
   * Gets the extensions version.
   *
   * @returns {String} a string with the extension version, like 1.9.3.
   */
  get EXTENSION_VERSION() {
      if (null == this._extension_version) {
          var browserName = ConfigSettings.BROWSER_NAME;

          switch(browserName) {
              case "safari":
                  var callback = function(info) {
                      var index = -1;
                      var version = "";
                      var keys = $(info).find("key");
                      $.each(keys, function(aIndex, aNode) {
                          if (aNode.textContent == "CFBundleVersion") {
                              index = aIndex;
                              return false;
                          }
                      });

                      if (index != -1) {
                          version = $(info).find("key ~ string").eq(index).get(0).textContent;
                      }

                      this._extension_version = version;
                  }.bind(this);

                  $.ajax({
                      type: "GET",
                      url: safari.extension.baseURI + 'Info.plist',
                      dataType: "xml",
                      async: false,
                      success: function(aXml) { callback(aXml); }
                  });
                  break;
              default:
                  var details = chrome.runtime.getManifest();
                  if(details && "version" in details) {
                      this._extension_version = details.version;
                  } else {
                      this._extension_version = '0.0.0.0';
                  }
                  break;
          }
      }

      return this._extension_version;
  },

  /**
   * Sets the extensions version.
   *
   * @param {String} value the string with the extension version, like 1.9.3.
   */
  set EXTENSION_VERSION(value) {
    this._extension_version = value;
  },

  /**
   * Gets the browser name.
   *
   * @returns {String} a string with the browser name: opera, firefox, safari, ie, edge, chrome, blink.
   */
  get BROWSER_NAME() {
      if (null == this._browser_name) {
          this._browser_name = "chrome";

          // Opera 8.0+
          var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
          if(isOpera) {
              this._browser_name = "opera";
          }

          // Firefox 1.0+
          var isFirefox = typeof InstallTrigger !== 'undefined';
          if(isFirefox) {
              this._browser_name = "firefox";
          }

          // Safari 3.0+ "[object HTMLElementConstructor]"
          var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));
          if(isSafari) {
              this._browser_name = "safari";
          }

          // Internet Explorer 6-11
          var isIE = /*@cc_on!@*/false || !!document.documentMode;
          if(isIE) {
              this._browser_name = "ie";
          }

          // Edge 20+
          var isEdge = !isIE && !!window.StyleMedia;
          if(isEdge) {
              this._browser_name = "edge";
          }

          // Chrome 1+
          var isChrome = !!window.chrome && !!window.chrome.webstore;
          if(isChrome) {
              this._browser_name = "chrome";
          }

          // Blink engine detection
          var isBlink = (isChrome || isOpera) && !!window.CSS;
          if(isBlink) {
              this._browser_name = "blink";
          }
      }

      return this._browser_name;
  },

  /**
   * Sets the browser name.
   *
   * @param {String} value the string with the browser name: opera, firefox, safari, ie, edge, chrome, blink.
   */
  set BROWSER_NAME(value) {
    this._browser_name = value;
  },

  METACERT_API_ENDPOINT_ADDRESS_BAR_URL_ENDPOINT : "",
  METACERT_API_ENDPOINT_WEBSITE_INTERNAL_URL_ENDPOINT : "",
  METACERT_API_KEY : "",
  METACERT_SECURITY_TOKEN : "",
  METACERT_ADDRESS_BAR_URL : "addressBarUrl",
  METACERT_WEBSITE_INTERNAL_URL : "websiteInternalUrl",

  METACERT_BLOCKPAGE: "http://block.metacert.com/?domain=#{DOMAIN}&redirect=#{REDIRECT}",
  METACERT_RATE_US_CHROME: "https://chrome.google.com/webstore/detail/cryptonite-by-metacert/keghdcpemohlojlglbiegihkljkgnige/reviews/?utm_source=CryptoniteByMetaCert",
  METACERT_RATE_US_FIREFOX: "https://addons.mozilla.org/en-US/firefox/addon/cryptonite-by-metacert/reviews/?utm_source=CryptoniteByMetaCert",
  METACERT_RATE_US_OPERA: "https://addons.opera.com/extensions/details/cryptonite-by-metacert/?#feedback-container",
  METACERT_FIRST_RUN_PAGE: "https://metacertprotocol.com/cryptonite-beta?via=cryptonite",
  METACERT_UPDATE_BETA_PAGE: "https://metacertprotocol.com/cryptonite-beta?via=cryptonite",
  METACERT_MAX_HISTORY_ITEMS: 10,
  METACERT_MAX_HISTORY_ITEMS_IN_ARRAY: 20,

  METACERT_BETA_PROGRAM_SUBSCRIPTION_URL_ENDPOINT: "",
  METACERT_BETA_PROGRAM_SUBSCRIPTION_SECURITY_TOKEN: "",
  METACERT_BETA_PROGRAM_SUBSCRIPTION_CONFIRMATION_PAGE: "",

  GOOD_CRYPTO_DOMAINS_ARRAY: [
    "0xproject.com",
    "aex.com",
    "anycoindirect.eu",
    "augur.net",
    "bigchaindb.com",
    "binance.com",
    "bit-z.com",
    "bit520.com",
    "bitcoin.co.id",
    "bitcoin.de",
    "bitfinex.com",
    "bitflyer.jp",
    "bithumb.com",
    "bitindia.co",
    "bitstamp.net",
    "bittrex.com",
    "blog.icoalert.com",
    "blog.oceanprotocol.com",
    "braziliex.com",
    "btron.io",
    "bx.in.th",
    "cex.io",
    "change-bank.com",
    "coinbase.com",
    "coinfund.io",
    "coingecko.com",
    "coinmarketcap.com",
    "coinomi.com",
    "coinone.co.kr",
    "coti.io",
    "creativecommons.com",
    "cryptoderivatives.market",
    "cryptominded.com",
    "cryptonator.com",
    "cryptopia.co.nz",
    "databrokerdao.com",
    "decentraland.org",
    "developer.metacert.com",
    "eos.io",
    "eosscan.io",
    "etherdelta.com",
    "ethereum.link",
    "ethereum.network",
    "etherhub.io",
    "ethermine.org",
    "etherscamdb.info",
    "etherscan.com",
    "etoro.com",
    "exmo.com",
    "galactictalk.org",
    "gate.io",
    "gdax.com",
    "gemini.com",
    "gemini24.zendesk.com",
    "globalminingtoken.com",
    "hellogold.org",
    "hitbtc.com",
    "huobi.pro",
    "ico.spectivvr.com",
    "icoalert.com",
    "iex.ec",
    "korbit.co.kr",
    "kraken.com",
    "lightyear.io",
    "lisk.io",
    "livecoinwatch.com",
    "mercuryprotocol.com",
    "metacert-crypto.slack.com",
    "metacert.com",
    "metacert.uservoice.com",
    "mona.co",
    "myetherwallet.com",
    "mymonero.com",
    "mystellar.org",
    "oceanprotocol.com",
    "oceanprotocol.slack.com",
    "okex.com",
    "omise.co",
    "onchainfx.com",
    "poloniex.com",
    "rexmls.com",
    "rialto.ai",
    "rise.vision",
    "singulardtv.asia",
    "singulardtv.com",
    "singularx.com",
    "slack.btron.io",
    "slack.coinfund.io",
    "slacksecurity.metacert.com",
    "spectivvr.com",
    "stellar.org",
    "stellarcommunity.org",
    "substratum.net",
    "the-blockchain.com",
    "tidex.com",
    "trust.metacert.com",
    "twitter.com/coinbase",
    "twitter.com/myetherwallet",
    "vaultbank.io",
    "wallet.singulardtv.com",
    "wavesplatform.com",
    "wax-token.slack.com",
    "waxtoken.com",
    "wex.nz",
    "yobit.net"
  ],

  KNOWN_DOMAINS_ARRAY_REG_EXP: [
    "360.cn",
    "abcnews.go.com",
    "accuweather.com",
    "adobe.com",
    "alexa.com",
    "alibaba.com",
    "aliexpress.com",
    "amazonaws.com",
    "aol.com",
    "apple.com",
    "archive.org",
    "ask.com",
    "avito.ru",
    "baidu.com",
    "bbc.co.uk",
    "bbc.com",
    "bbm.com",
    "bet365.com",
    "bing.com",
    "block.metacert.com",
    "bongacams.com",
    "booking.com",
    "box.com",
    "cnn.com",
    "cnzz.com",
    "coccoc.com",
    "dailymail.co.uk",
    "detail.tmall.com",
    "diply.com",
    "disk.yandex.com",
    "duckduckgo.com",
    "fc2.com",
    "flipdrive.com",
    "foxnews.com",
    "free-hidrive.com",
    "globo.com",
    "gmw.cn",
    "go2cloud.org",
    "googleusercontent",
    "hao123.com",
    "hidrive.com",
    "hubic.com",
    "huffingtonpost.com",
    "icloud.com",
    "idrive.com",
    "imdb.com",
    "imgur.com",
    "imo.im",
    "irc.com",
    "jd.com",
    "jumpshare.com",
    "kakao.com",
    "latimes.com",
    "line.me",
    "live.com",
    "livejasmin.com",
    "localhost",
    "mail.ru",
    "mediafire.com",
    "mega.nz",
    "messenger.com",
    "metacert-block.com",
    "microsoft.com",
    "microsoftonline.com",
    "msn.com",
    "mydrive.ch",
    "naver.com",
    "nextcloud.com",
    "nicovideo.jp",
    "nytimes.com",
    "office.com",
    "ok.ru",
    "onclckds.com",
    "paypal.com",
    "pcloud.com",
    "pinterest.com",
    "pixnet.net",
    "popads.net",
    "pornhub.com",
    "qq.com",
    "quora.com",
    "rakuten.co.jp",
    "redtube.com",
    "reuters.com",
    "reuters.tv",
    "samsung.com",
    "sina.com.cn",
    "skype.com",
    "slack.com",
    "snapchat.com",
    "sohu.com",
    "soso.com",
    "soundcloud.com",
    "spideroak.com",
    "stackoverflow.com",
    "sync.com",
    "taobao.com",
    "telegram.org",
    "theguardian.com",
    "tianya.cn",
    "tmall.com",
    "twitch.tv",
    "txxx.com",
    "uol.com.br",
    "usatoday.com",
    "vk.com",
    "walmart.com",
    "washingtonpost.com",
    "wechat.com",
    "weibo.com",
    "wikipedia.org",
    "wolframalpha",
    "wsj.com",
    "xhamster.com",
    "xnxx.com",
    "xvideos.com",
    "yandex.ru"
  ],

  //TODO: add new urls here in case we need to remove an url from the access-anyway list.
  REMOVE_FROM_ACCESS_ANYWAY_ARRAY: [
    "https://twitter.com",
    "https://eosdac.io/airdrop/",
    "https://www.myetherwallet.com/",
    "https://myetherwallet.com/"
  ],

  /**
   * Initiliazes the object.
   */
  _init : function() {
  }
};

/**
 * Constructor.
 */
(function() { this._init(); }).apply(ConfigSettings);
