if (typeof(define) !== 'function') var define = require('amdefine')(module);

define(function(require) {
    "use strict";
    function DataStruct(arg){
        var ds = {},
            array = arg.array || [],
            header = arg.header || arg.fields || array[0],
            types = arg.types || [],
            struct = arg.struct,
            skip = arg.skip || 0,
            parsers = [],
            data = arg.data || [];

        if(types.length && typeof(types) == 'string'){
            var ta = [];
            for (var i = 0; i < header.length; i++) {
                ta.push(types);
            }
            types = ta;
        }

        if(typeof struct == "object") {
            header = Object.keys(struct);
            types = Object.keys(struct).map(function(h){ return struct[h]; });
        }

        if(typeof skip == "number") {
            for(var j = 0; j<skip; j++)
                array.shift();
        }

        types.forEach(function(t){
            parsers.push(getParser(t));
        })

        function parseDate(input) {
          var parts = input.split('-');
          return new Date(parts[0], parts[1]-1, parts[2]);
        }

        function getParser(type){
            if(type == "int" || type.match("veci*")) {
                return function(value){ var res = parseInt(value); return (isNaN(res)) ? 0 : res; };
            } else if(type == "float" || type.match("vecf*")) {
                return function(value){ var res = parseFloat(value); return (isNaN(res)) ? 0 : res; };
            } else if(["date", "time", "datetime"].indexOf(type)!=-1) {
                return function(value){ return new Date(value); };
                // return parseDate(value);
            } else if(["money", "price", "cost"].indexOf(type)!=-1) {
                return function(value){ return parseFloat(value.substring(1)); };
            } else {
                return function(value){ return value; };
            }
        }

        ds.objectArray = function(){

            if(typeof(header) !== "undefined" && header.length){
                var l = header.length;
                array.forEach(function(a){
                    var o = {}, offset = 0;
                    for(var i = 0; i < l; i++){
                        var k = header[i];
                        if(k.length) {
                            if(types[i].match(/^(veci|vecf)\d+$/)) {
                                var vl = parseInt(types[i].slice(4)),
                                    vector = [];
                                a.slice(offset, offset + vl).forEach(function(vi){
                                    vector.push(parsers[i](vi));
                                });
                                o[k] = vector;
                                offset += vl;
                            } else {
                                o[k] = parsers[i](a[offset]);
                                offset++;
                            }
                        }
                    }
                    data.push(o);
                });
            }

            data.join = function(_) {
                return leftJoin(data, _);
            }

            data.embed = function(spec) {

                var id = spec.$id || spec.$by,
                    attributes = Object.keys(spec);

                if(!id) throw Error("No id specified for embed!");

                attributes.filter(function(attr){return (attr != "$by" && attr != "$id")}).forEach(function(attr){

                    var embedKey = spec[attr][0][id],
                        i = 0,
                        n = data.length,
                        l = spec[attr].length;

                    var lookup = data.map(function(d){ d[attr] = []; return d[id];});

                    for(i = 0; i < l; i++) {
                        var index = lookup.indexOf(spec[attr][i][id]);
                        if(index !== -1) {
                            data[index][attr].push(spec[attr][i]);
                        }
                        // delete spec[attr][i][id];
                    }

                });
                return data;
            }

            return data;
        }

        ds.rowArray = function(){
            array.forEach(function(a){
                var row = [];
                header.forEach(function(k,i){
                    if(k.length) {
                        row.push(parsers[i](a[i]));
                    }
                });
                data.push(row);
            });
            data.fields = header;
            data.struct = "rowArray";
            return data;
        }

        //TODO: make columnArray extensible like rowArray and objectArray
        ds.columnArray = function() {
            header.forEach(function(k,i){
                var column = array.map(function(a){
                    return a[i];
                });
                data.push(column);
            });
            data.fields = header;
            data.struct = "columnArray";
            return data;
        }

        return ds;
    };

    function leftJoin(oal, oar) {
        var len = oal.length,
            keyL = Object.keys(oal[0]),
            keyR = Object.keys(oar[0]);

        keys = keyR.filter(function(kr){ return (keyL.indexOf(kr) === -1);});

        for(var i = 0; i < len; i++) {
            keys.forEach(function(k){
                oal[i][k] = oar[i][k];
            });
        }

        return oal;
    }

    DataStruct.join = leftJoin;

    return DataStruct;
});
