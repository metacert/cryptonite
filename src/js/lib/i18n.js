var i18n = {
  _data: null,

  get data() {
    return this._data;
  },

  set data(value) {
    this._data = value;
  },

  setLocaleData: function() {
    var language = navigator.language.toLowerCase();

    if (LOCALES[language]) {
      this.data = LOCALES[language];
    } else {
      // let's try using only the first part of the language
      language = language.substring(0,2);
      if (LOCALES[language]) {
        this.data = LOCALES[language];
      } else {
        this.data = LOCALES["en"];
      }
    }
  },

  getMessage: function(key) {
    if("undefined" !== typeof(chrome)) {
      return chrome.i18n.getMessage(key);
    } else {
      if (!this.data) {
        this.setLocaleData();
      }
      return this.data[key]["message"];
    }
  }
};
