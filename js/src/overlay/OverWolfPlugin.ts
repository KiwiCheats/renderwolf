class OverWolfPlugin {
    static _pluginInstance;
    _extraObjectName;
    _addNameToObject;

    constructor(extraObjectNameInManifest, addNameToObject) {
        this._extraObjectName = extraObjectNameInManifest;
        this._addNameToObject = addNameToObject;
    }

    // public
    initialize(callback) {
        if (OverWolfPlugin._pluginInstance)
            return callback(true);
        return this._initialize(callback);
    }

    initialized() {
        return OverWolfPlugin._pluginInstance != null;
    };

    get() {
        return OverWolfPlugin._pluginInstance;
    };

    // privates
    _initialize(callback) {
        let proxy = null;
        let plugin = this;

        try {
            proxy = overwolf.extensions.current.getExtraObject;
        } catch (e) {
            console.error(
                "overwolf.extensions.current.getExtraObject doesn't exist!");
            return callback(false);
        }

        proxy(this._extraObjectName, function (result) {
            if (result.status != "success") {
                console.error(
                    "failed to create " + plugin._extraObjectName + " object: " + result);
                return callback(false);
            }

            OverWolfPlugin._pluginInstance = result.object;

            if (plugin._addNameToObject) {
                OverWolfPlugin._pluginInstance._PluginName_ = plugin._extraObjectName;
            }

            return callback(true);
        });
    }
}

export { OverWolfPlugin };