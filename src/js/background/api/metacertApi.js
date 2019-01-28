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
  checkUrl : function(aUrl, aNodeId, aType, aCallback) {
    var body = {};
    body.url = aUrl;
    body.nodeId = aNodeId;
    body.timestamp = $.now();

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
   * Activates a subscription id code on the activation API.
   *
   * @param {Object} aData the data to be sent to the activation API. In this case we only send subscription id.
   * @param {Function} aCallback the callback to call after we send the data to the activation API.
   */
  submitPurchaseCodeData : function(aData, aCallback) {
    $.ajax({
      type: 'POST',
      url: ConfigSettings.METACERT_PURCHASE_CODE_ACTIVATION_ENDPOINT,
      beforeSend: function (request) {
        request.setRequestHeader("Api-Key", ConfigSettings.METACERT_API_KEY);
        request.setRequestHeader("Security-Token", ConfigSettings.METACERT_SECURITY_TOKEN);
        request.setRequestHeader("Content-Type", "application/json");
      },
      data: JSON.stringify(aData),
      timeout: 60 * 1000,
    }).done(function(aData, aTextStatus, aXHR) {
      if (aCallback) {
        if(aXHR && "status" in aXHR && "200" == aXHR.status) {
          aCallback(true, aData);
        } else {
          aCallback(false, aData);
        }
      }
    }).fail(function(aXHR, aTextStatus, aError) {
      if (aCallback) {
        aCallback(false, aData);
      }
    });
  },

  /**
   * Checks the payment status for a subscription id on Stripe.
   *
   * @param {Object} aData the data to be sent to the lookup API. In this case we only send subscription id.
   * @param {Function} aCallback the callback to call after we send the data to the lookup API.
   */
  checkExtensionStatus : function(aData, aCallback) {
    $.ajax({
      type: 'POST',
      url: ConfigSettings.METACERT_PURCHASE_CODE_LOOKUP_ENDPOINT,
      beforeSend: function (request) {
        request.setRequestHeader("Api-Key", ConfigSettings.METACERT_API_KEY);
        request.setRequestHeader("Security-Token", ConfigSettings.METACERT_SECURITY_TOKEN);
        request.setRequestHeader("Content-Type", "application/json");
      },
      data: JSON.stringify(aData),
      timeout: 60 * 1000,
    }).done(function(aData, aTextStatus, aXHR) {
      if (aCallback) {
        if(aXHR && "status" in aXHR && "200" == aXHR.status) {
          aCallback(true, aData);
        } else {
          aCallback(false, aData);
        }
      }
    }).fail(function(aXHR, aTextStatus, aError) {
      if (aCallback) {
        aCallback(false, aData);
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
    //we will use pro as the default endpoint
    var url = ConfigSettings.METACERT_API_ENDPOINT_PRO;
    switch(ConfigSettings.SUBSCRIPTION_TYPE) {
      case ConfigSettings.SUBSCRIPTION_TYPE_STANDARD:
        url = ConfigSettings.METACERT_API_ENDPOINT_STANDARD;
        break;
      case ConfigSettings.SUBSCRIPTION_TYPE_PRO:
        url = ConfigSettings.METACERT_API_ENDPOINT_PRO;
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
          request.setRequestHeader("Api-Key", ConfigSettings.METACERT_API_KEY);
          request.setRequestHeader("Security-Token", ConfigSettings.METACERT_SECURITY_TOKEN);
          request.setRequestHeader("x-cryptonite-version", ConfigSettings.EXTENSION_VERSION);
          request.setRequestHeader("x-cryptonite-browser", ConfigSettings.BROWSER_NAME);
        },
        jsonp: false,
        timeout: 60 * 1000,
      }).done(function(aData, aTextStatus, aXHR) {
        //we will only process OK responses
        if(aXHR && "status" in aXHR && ("200" == aXHR.status || "204" == aXHR.status)) {
          if (aCallback) {
            aCallback(aData);
          }
        }
      }).fail(function(aXHR, aTextStatus, aError) {
        //let's do nothing on fail
      });

  }
};
