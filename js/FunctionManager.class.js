function FunctionManager() {
    this.predefined = [];
}

FunctionManager.prototype.loadByName = function(name, onLoad) {
    let path = getBaseUrl() + `/functions/${name}.json`;
    this.loadByPath(path, onLoad);
};

FunctionManager.prototype.loadByPath = function(jsonPath, onLoad) {
    let _this = this;

    loadJSON(jsonPath, function (file) {
        let keys = Object.keys(file);
        if (keys.length !== 1)
            throw new Error("Defined more than one name");

        let name = keys[0];
        _this.predefined[name] = file[name];
        if (onLoad) onLoad();
    });
};

FunctionManager.prototype.load = function(functions, onFinish) {
    let counter = 0;
    let _this = this;
    functions.forEach(function(f) {
        _this.loadByName(f, function(){
            counter++;
            if (counter >= functions.length && onFinish) {
                //_this.predefined = _this.predefined.sortByKey();
                onFinish();
            }
        });
    });
};

