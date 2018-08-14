(function($) {
  $.i18n = function(aOptions) {
    var options = aOptions || {};
    var wrappedSet = this;
    /**
     * Applies the locale to the relevant elements by the given data.
     * @param aOptions the options.
     */
    function applyLocale(aOptions) {
      var attrNames = aOptions.attributeNames || [];
      const RE_LOCALE_KEY_NAME = /^i18n\[(.*?)\]/;

      wrappedSet.each(function() {
        var elem = $(this);
        if (elem.attr("rel")) {
          var results = elem.attr("rel").match(RE_LOCALE_KEY_NAME);
          if (results && results[1]) {
            elem.text($.i18n.getString(results[1], null));
          }
        }

        $.each(attrNames, function(aIndex, aValue) {
          if (elem.attr(aValue)) {
            var results = elem.attr(aValue).match(RE_LOCALE_KEY_NAME);

            if (results && results[1]) {
              elem.attr(aValue, $.i18n.getString(results[1], null));
            }
          }
        });
      });
    }

    applyLocale(options);
  };

  // attach the i18n object and its methods to the jQuery object.
  $.fn.i18n = $.i18n;

  // get the string for a key.
  $.i18n.getString = function(aKey, aStrArray) {
    var key;
    var str;

    // Replace dots with underscores, to match Google Chrome's i18n policy
    key = aKey.replace(/\./g,"_");
    str = i18n.getMessage(key);

    // replace placeholders.
    if ($.isArray(aStrArray)) {
      $.each(aStrArray, function(aIndex, aValue) {
        str = str.replace("%S" + (aIndex + 1), aValue);
      });
      str = str.replace("%S", aStrArray[0]);
    }

    return str;
  };

})(jQuery);
