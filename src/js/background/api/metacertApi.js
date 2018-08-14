/**
 * @classdesc Class that is used to call the MetaCert API to check for url and retrieve their categories from the API.
 *
 * @class MetaCertApi
 */
var MetaCertApi = {

  /**
   * Checks an url passed as parameter.
   *
   * @param {String} aUrl the url to be checked.
   * @param {String} aType the type of url to process: addressBar or websiteInternalUrl.
   * @param {Function} aCallback the callback to be called on return.
   */
  checkUrl : function(aUrl, aType, aCallback) {
    var body = {};
    body.url = aUrl;

    this._sendRequest(aType, "POST", body, aCallback);
  },

  /**
   * Sends the data to subscribe to the Metacert Beta Program.
   *
   * @param {Object} aData the data to be sent to the subscription API. In this case we only send the user's email.
   * @param {Function} aCallback the callback to call after we send the data to the subscription API.
   */
  submitSubscriptionData : function(aData, aCallback) {
    $.ajax({
      type: 'POST',
      url: ConfigSettings.METACERT_BETA_PROGRAM_SUBSCRIPTION_URL_ENDPOINT,
      beforeSend: function (request) {
        request.setRequestHeader("Security-Token", ConfigSettings.METACERT_BETA_PROGRAM_SUBSCRIPTION_SECURITY_TOKEN);
        request.setRequestHeader("Cache-Control", ConfigSettings.METACERT_BETA_PROGRAM_SUBSCRIPTION_CACHE_CONTROL);
        request.setRequestHeader("Content-Type", "application/json");
      },
      data: JSON.stringify(aData),
      timeout: 60 * 1000,
    }).done(function(aData, aTextStatus, aXHR) {
      if (aCallback) {
        if(aXHR && "status" in aXHR && "200" == aXHR.status) {
          aCallback(true);
        } else {
          aCallback(false);
        }
      }
    }).fail(function(aXHR, aTextStatus, aError) {
      if (aCallback) {
        aCallback(false);
      }
    });
  },

  /**
   * Sends a request to the metacert API.
   *
   * @param {String} aType the place from where we retrieved the url: address bar || webpage.
   * @param {String} aMethod the method to be used: GET || POST.
   * @param {Object} aBody the request body to be sent to the API.
   * @param {Function} aCallback the callback to be called on return.
   */
  _sendRequest : function(aType, aMethod, aBody, aCallback) {
    var url;
    switch(aType) {
      case ConfigSettings.METACERT_ADDRESS_BAR_URL:
        url = ConfigSettings.METACERT_API_ENDPOINT_ADDRESS_BAR_URL_ENDPOINT;
        break;
      default:
        url = ConfigSettings.METACERT_API_ENDPOINT_WEBSITE_INTERNAL_URL_ENDPOINT;
        break;
    }

    var request =
      $.ajax({
        type: aMethod,
        contentType: "application/json",
        url: url,
        data: JSON.stringify(aBody),
        dataType: "json",
        beforeSend: function (request) {
          request.setRequestHeader("apiKey", ConfigSettings.METACERT_API_KEY);
          request.setRequestHeader("Security-Token", ConfigSettings.METACERT_API_KEY);
          request.setRequestHeader("Cache-Control", ConfigSettings.METACERT_CACHE_CONTROL);
          request.setRequestHeader("x-cryptonite-version", ConfigSettings.EXTENSION_VERSION);
          request.setRequestHeader("x-cryptonite-browser", ConfigSettings.BROWSER_NAME);
        },
        jsonp: false,
        timeout: 60 * 1000,
      }).done(function(aData, aTextStatus, aXHR) {
        //we will only process OK responses
        if(aXHR && "status" in aXHR && "200" == aXHR.status) {
          if (aCallback) {
            aCallback(aData);
          }
        }
      }).fail(function(aXHR, aTextStatus, aError) {
        //let's do nothing on fail
      });

  }
};
