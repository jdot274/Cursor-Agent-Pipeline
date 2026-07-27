mergeInto(LibraryManager.library, {
  RelayExactSetMode: function (modePtr) {
    var mode = UTF8ToString(modePtr);
    if (window.RelayExactHost) window.RelayExactHost.setMode(mode);
  },

  RelayExactLoadSpline: function (urlPtr) {
    var url = UTF8ToString(urlPtr);
    if (window.RelayExactHost) window.RelayExactHost.loadSpline(url);
  },

  RelayExactLoadShadertoy: function (idPtr) {
    var id = UTF8ToString(idPtr);
    if (window.RelayExactHost) window.RelayExactHost.loadShadertoy(id);
  },

  RelayExactSetControl: function (namePtr, value) {
    var name = UTF8ToString(namePtr);
    if (window.RelayExactHost) window.RelayExactHost.setControl(name, value);
  }
});
