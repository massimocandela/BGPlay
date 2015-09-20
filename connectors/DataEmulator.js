/**
 * Author: Max
 * Date: 05/09/2015
 * Please refer to LICENSE.txt for information about the license.
 */


var DataEmulator = function(){

    this._usedSources = [];
    this._usedNodes = [];
    this._usedPaths = {};
    this._target = {
        as_number: 3333,
        owner: "OWNER",
        prefix: "193.0.0.0/21"
    };

    this._getRandomPosition = function(maximum){
        return Math.floor(Math.random() * maximum);
    };

    this._getUsedSource = function(){
        var position;

        position = this._getRandomPosition(this._usedSources.length);

        return this._usedSources[position];
    };

    this._getUsedPath = function(source, target){
        var position, key;

        key = source.as_number + "-" + target.as_number;
        if (this._usedPaths[key] != null){
            position = Math.floor((Math.random() * this._usedPaths[key].length) -1);

            return this._usedPaths[key][position];
        } else {
            this._usedPaths[key] = [];
            return null;
        }
    };

    this._generateAsNumber = function(){
        return parseInt((Math.random() * 50000) + 1)
    };

    this._generateSource = function(){
        var asNumber = this._generateAsNumber();
        return {
            "as_number": asNumber,
            "rrc": "00",
            "id": "00-111.91.233." + asNumber,
            "ip": "111.91.233." + asNumber
        };
    };

    this._getSource = function(){
        var source;

        if (parseInt((Math.random() * 10) + 1) == 1){
            source = this._generateSource();
            this._usedSources.push(source);
        } else {
            source = this._getUsedSource();
            if (!source){
                source = this._generateSource();
                this._usedSources.push(source);
            }
        }

        return source;
    };

    this._generatePath = function(source, target){
        var numberItems, path;

        path = [];
        numberItems = parseInt((Math.random() * 3) +1);
        path.push(source);
        for (var i = 0; i < numberItems; i++) {
            path.push(this._getNode());
        }
        path.push(target);

        return path;
    };

    this._getPath = function(source, target){
        var path, key;

        key = source.as_number + "-" + target.as_number;
        if (parseInt((Math.random() * 10) + 1) < 2){
            path = this._generatePath(source, target);
            this._usedPaths[key] = this._usedPaths[key] || [];
            this._usedPaths[key].push(path);
        } else {
            path = this._getUsedPath(source, target);
            if (!path){
                path = this._generatePath(source, target);
                this._usedPaths[key].push(path);
            }
        }

        return path;
    };

    this._generateNode = function(){
        return {
            owner: "OWNER",
            as_number: this._generateAsNumber()
        }
    };

    this._getUsedNode = function(){
        var position;

        position = this._getRandomPosition(this._usedNodes.length);

        return this._usedNodes[position];
    };

    this._getNode = function(){
        var node;
        if (parseInt((Math.random() * 10) + 1) < 2){
            node = this._generateNode();
            this._usedNodes.push(node);
        } else {
            node = this._getUsedNode();
            if (!node){
                node = this._generateNode();
                this._usedNodes.push(node);
            }
        }

        return node;
    };

    this._generateItem = function(){
        var source, item;

        source = this._getSource();
        item = {
            type: "A",
            timestamp: parseInt(new Date().getTime()/1000),
            source: source,
            target: this._target,
            path: this._getPath(source, this._target),
            community: [[1,2], [3,4]]
        };
        return item;
    };


    this.start = function(callback){
        var $this;

        window.start = function(){
            $this.start(callback);
        };
        $this = this;
        setTimeout(function(){
            callback($this._generateItem());
        }, 1000);

        window.tt = setInterval(function(){
            callback($this._generateItem());
        }, 1000);
    };

    window.stop = function(){
        clearInterval(window.tt);
    };


};