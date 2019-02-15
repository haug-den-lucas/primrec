function FunctionManager() {
    this.predefined = {};
}

FunctionManager.prototype.loadByName = function(name, onLoad) {
    let path = getBaseUrl() + `/functions/${name}.json`;
    this.loadByPath(path, onLoad);
};

FunctionManager.prototype.loadByPath = function(jsonPath, onLoad) {
    let _this = this;

    loadJSONFromUrl(jsonPath, function (file) {
        let keys = Object.keys(file);

        let counter = 0;
        keys.forEach(function (name) {
            counter++;
            _this.predefined[name] = file[name];
            if (counter >= keys.length && onLoad) onLoad();
        });

    });
};

FunctionManager.prototype.load = function(functions, onFinish) {
    let counter = 0;
    let _this = this;
    functions.forEach(function(f) {
        _this.loadByName(f, function(){
            counter++;
            if (counter >= functions.length && onFinish) {
                onFinish(sortByKey(_this.predefined));
            }
        });
    });
};

