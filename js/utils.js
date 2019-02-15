function loadJSONFromUrl(url, onSuccess, onError) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
        var status = xhr.status;
        if (status === 200) {
            if (onSuccess)
                onSuccess(xhr.response, status);
        } else {
            if (onError)
                onError(xhr.response, status);
        }
    };
    xhr.send();
}

function getBaseUrl() {
    return window.location.protocol + "//" + window.location.host + "/" + window.location.pathname.split('/')[1]
}

function sortByKey (old) {
    let keys = Object.keys(old).sort();
    let result = {};
    keys.forEach(function (key) {
        result[key] = old[key];
    });
    return result;
};

Array.prototype.appendList = function (arr) {
    var _this = this;
    arr.forEach(function (obj) {
       _this.push(obj);
    });
    return _this;
};