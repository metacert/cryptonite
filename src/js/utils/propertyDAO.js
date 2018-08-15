/**
 * @classdesc Wrapper to store name/value pairs, based on HTML5 local storage.
 *
 * @class PropertyDAO
 */
var PropertyDAO = {
  PROP_ENABLE_BANNER_ANNOTATION :                'metacert.cryptonite.general.enable.banner.annotation',
  PROP_ENABLE_WEBSITE_ANNOTATIONS :              'metacert.cryptonite.general.enable.website.annotations',
  PROP_ENABLE_TWITTER_MENTIONS_ANNOTATIONS :     'metacert.cryptonite.general.enable.twitter.mentions.annotations',
  PROP_FIRST_RUN_PAGE_DISPLAYED :                'metacert.cryptonite.general.firstRunPage.displayed',
  PROP_CRYPTOCURRENCY_URLS_HISTORY_ARRAY :       'metacert.cryptonite.general.crypto.urls.history.array',
  PROP_ACCESS_ANYWAY_URLS_ARRAY :                'metacert.cryptonite.general.access.anyway.urls.array',
  PROP_DISPLAY_UPDATE_BANNER :                   'metacert.cryptonite.general.display.update.banner',
  PROP_DISPLAY_INSTALL_BANNER :                  'metacert.cryptonite.general.display.install.banner',
  PROP_UPDATE_BANNER_TAB_ID  :                   'metacert.cryptonite.general.update.banner.tab.id',
  PROP_INSTALL_BANNER_TAB_ID  :                  'metacert.cryptonite.general.install.banner.tab.id',
  PROP_IS_ACCESS_ANYWAY_FIX_APPLIED :            'metacert.cryptonite.general.is.access.anyway.fix.applied',

  /* Default properties and values. */
  DEFAULT_PROPERTIES : {
    PROP_ENABLE_BANNER_ANNOTATION :              true,
    PROP_ENABLE_WEBSITE_ANNOTATIONS :            true,
    PROP_ENABLE_TWITTER_MENTIONS_ANNOTATIONS :   true,
    PROP_FIRST_RUN_PAGE_DISPLAYED :              false,
    PROP_CRYPTOCURRENCY_URLS_HISTORY_ARRAY :     [],
    PROP_ACCESS_ANYWAY_URLS_ARRAY :              [],
    PROP_DISPLAY_UPDATE_BANNER :                 false,
    PROP_DISPLAY_INSTALL_BANNER :                false,
    PROP_UPDATE_BANNER_TAB_ID :                  -1,
    PROP_INSTALL_BANNER_TAB_ID :                 -1,
    PROP_IS_ACCESS_ANYWAY_FIX_APPLIED :          false
  },

  /**
   * Initializes the resource.
   */
  init : function() {

    //sets the default properties if the values don't exist
    $.each(this.DEFAULT_PROPERTIES, function(aName, aValue) {
      if (this.get(PropertyDAO[aName]) === null) {
        this.set(PropertyDAO[aName], aValue);
      }
    }.bind(this));

    var allAnnotationsOldValue = this.get('metacert.cryptonite.general.enable.all.annotations');
    if('undefined' != typeof(allAnnotationsOldValue) && null !== allAnnotationsOldValue) {
      //migrate the old value to the new pref
      this.set(PropertyDAO.PROP_ENABLE_BANNER_ANNOTATION, allAnnotationsOldValue);
      //remove the old value
      this.remove('metacert.cryptonite.general.enable.all.annotations');
    }
  },

  /**
   * Sets a property on the HTML5 local storage.
   *
   * @param {String} aKey the property key.
   * @param {Object} aValue the property value.
   */
  set : function(aKey, aValue) {

    if(typeof aValue !== 'string') {
      aValue = JSON.stringify(aValue);
    }

    localStorage.setItem(aKey, aValue);
  },

  /**
   * Gets a property from the HTML5 local storage.
   *
   * @param {String} aKey the property key.
   * @return {Object} the property value.
   */
  get : function(aKey) {

    var propValue = localStorage.getItem(aKey);

    try {
      //first we try to parse the object from local storage.
      propValue = JSON.parse(propValue);
    } catch (e) {
      //if the object can not be parsed, let's use the object in its original form.
    }

    //XXX : if the value is a boolean, it still returns a string so a conversion is needed.
    if (propValue == "true") {
      propValue = true;
    } else if (propValue == "false") {
      propValue = false;
    }

    return propValue;
  },

  /**
   * Removes a property from the HTML5 local storage.
   *
   * @param {String} aKey the property key.
   */
  remove : function(aKey) {

    localStorage.removeItem(aKey);
  },

  /**
   * Clears all the stored properties from the HTML5 local storage.
   */
  clear : function() {

    localStorage.clear();
  }
};
