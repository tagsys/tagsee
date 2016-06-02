materialAdmin

    // =========================================================================
    // Utility service
    // =========================================================================
// =========================================================================
// Header Messages and Notifications list Data
// =========================================================================

    .service('messageService', ['$resource', function ($resource) {
        this.getMessage = function (img, user, text) {
            var gmList = $resource("data/messages-notifications.json");

            return gmList.get({
                img: img,
                user: user,
                text: text
            });
        }
    }])

    // =========================================================================
    // Malihu Scroll - Custom Scroll bars
    // =========================================================================
    .service('scrollService', function () {
        var ss = {};
        ss.malihuScroll = function scrollBar(selector, theme, mousewheelaxis) {
            $(selector).mCustomScrollbar({
                theme: theme,
                scrollInertia: 100,
                axis: 'yx',
                mouseWheel: {
                    enable: true,
                    axis: mousewheelaxis,
                    preventDefault: true
                }
            });
        }

        return ss;
    })
    
    .service('utilService', function ($http, $q) {
        var service = {};

        /**
         *  GET 方法
         * @param url
         *
         * @returns {*}
         */
        service.get = function (url) {

            var deferred = $q.defer();
            try {
                $http.get(url).success(function (data) {
                    if (data.errorCode == 0) {
                        deferred.resolve(data);
                    } else {
                        if (data.errorCode == 401) {
                            window.location.href = "/login";
                        } else {
                            deferred.reject(data);
                        }
                    }
                }).error(function (data) {
                    deferred.reject(data);
                });
            } catch (e) {
                deferred.reject({errorCode: -1, message: e.message});
            }
            return deferred.promise;
        };

        /**
         * POST 方法
         * @param url
         * @param postData
         * @returns {*}
         */
        service.post = function (url, data) {

            var deferred = $q.defer();
            try {
                $http.post(url, data).success(function (data) {
                    if (data.errorCode == 0) {
                        deferred.resolve(data);
                    } else {
                        if (data.errorCode == 401) {
                            window.location.href = "/login";
                        } else {
                            deferred.reject(data);
                        }
                    }
                }).error(function (data) {
                    deferred.reject(data);
                });
            } catch (e) {
                deferred.reject({errorCode: -1, message: e.message});
            }
            return deferred.promise;
        };

        return service;

    })

    // =========================================================================
    // Hub service
    // =========================================================================

    .service('hubService', function (utilService) {

        var service = {};

        service.discover = function () {

            return utilService.get("/service/discover");

        }

        service.createAgent = function (ip, name, remark) {

            return utilService.post("/service/agent/create", {
                ip: ip, name: name, remark: remark
            });
        }

        service.updateAgent = function (ip, name, remark) {
            return utilService.post("/service/agent/" + ip + "/update", {
                name: name, remark: remark
            });
        }

        service.removeAgent = function (ip) {
            return utilService.post("/service/agent/" + ip + "/remove");
        }

        service.startAgent = function (ip) {
            return utilService.get("service/agent/" + ip + "/start");
        }


        return service;
    })

    // =========================================================================
    // Data service
    // EXP Structure:
    //    filters: {epc: {filtered, amount}}
    //    readings:[]
    //
    // =========================================================================

    .service('dataService', function (utilService, Loki, $timeout, $websocket, $location) {

        var service = {}

        service._idbAdapter = new LokiIndexedAdapter('tagsee');
        service._db = new Loki("tagsee.json", {
            autosave: true,
            autosaveInterval: 1000,
            persistenceMethod: 'adapter',
            adapter: service._idbAdapter
        })

        service._db.loaded = false;

        service._lastHeatbeat = null;

        service.load = function (callback) {

            if(!service._db.loaded) {
                service._db.loadDatabase({}, function (result) {
                    service._expCollection = service._db.getCollection('exp');
                    if (!service._expCollection) {
                        service._expCollection = service._db.addCollection('exp');
                    }

                    service._db.loaded = true;
                    callback(service._expCollection);
                });
            }else{
                callback(service._expCollection);
            }
        }



        var dataStream = $websocket('ws://'+location.host+'/socket');

        var collection = [];

        dataStream.onMessage(function(message) {

            var result = JSON.parse(message.data);

            if(result.errorCode=='undefined' || result.errorCode!=0){
                console.log(message);
                return;
            }

            if(result.type == "heartbeat"){
                //ignoring, just keep alive
                service._lastHeatbeat = result.timestamp;
                console.log('heartbeat...');
                return;
            }


            if(service.currentExp && result.type == "readings") {

                for (var i = 0; i < result.tags.length; i++) {
                    var tag = result.tags[i];
                    service.currentExp.amount = service.currentExp.amount + 1;
                    if (!service.currentExp.readings) {
                        service.currentExp.readings = [];
                    }
                    service.currentExp.readings.push(tag);

                    if (!service.currentExp.filters) {
                        service.currentExp.filters = [];
                    }

                    var filters = service.currentExp.filters;

                    if (filters[tag.epc]) {
                        filters[tag.epc].amount++;
                    } else {
                        filters[tag.epc] = {amount: 1, checked: true};
                    }

                }
            }
        });

        dataStream.onError(function(message){
            sweetAlert("Oops...Something wrong!", "Websocket error....", "error");
        })

        var startTimer = function (exp) {
            $timeout(function () {
                exp.elapse = exp.elapse + 1;
                if (exp.interval > 0 && exp.elapse > exp.interval) {
                    service.end(exp, function () {
                    });
                }
                if (exp.isReading) {
                    startTimer(exp);
                }
            }, 1000);
        }

        service.begin = function (ip, marker, interval, cb) {
            var exp = {
                ip: ip, // the reader's ip
                marker: marker, // the experiment marker
                startTime: new Date().getTime(), // absolute start time.
                interval: interval, //how long to read.
                isReading: true, // determining whether it is reading
                elapse: 0, // time elapsed for the experiment.
                amount:0, // the total number of tags has been read.
                filters:{}, //filtering epcs
                readings:[], // all readings
                visibleProperties:null, //property names visible
                chartSettings:[],// chart settings
                events:{'insert':[],'delete':[]}//event triggers
            };

            exp = service._expCollection.insert(exp);

            service._db.saveDatabase();
            service.currentExp = exp;

            if (exp) {
                utilService.get('/service/agent/' + exp.ip + "/start").then(function (result) {
                    startTimer(exp);
                    cb(null, exp);
                }, function (result) {
                    cb(result);
                    if (result.errorCode) {
                        exp.error = result.errorCode;
                    } else {
                        exp.error = 505;
                    }
                })
            } else {
                cb({errorCode: -1, errorMessage: "It fails to insert the new experiment to database."});
            }

        }

        service.end = function (exp, cb) {

            var ip = null;

            if (!(typeof(exp) === 'string')) {
                exp.isReading = false;
                exp.endTime = new Date().getTime();
                // service._expCollection.update(exp);
                ip = exp.ip;
            } else {
                ip = exp;
            }

            service.currentExp = null;

            utilService.get('/service/agent/' + ip + "/stop").then(function (result) {
                cb(null, exp);
            }, function (result) {
                cb(result);
                exp.error = result.errorCode;
            })


        }


        service.discard = function (exp, cb) {

            service._expCollection.remove(exp);

        }

        service.destroy = function(){

            var data = service._expCollection.data;

            service._expCollection.removeDataOnly();
            service.save();

        }

        service.get = function(expId){
            return service._expCollection.get(expId);
        }

        service.save = function(){
            service._db.save();
        }

        service.update = function(exp){
            return service._expCollection.update(exp);
        }

        return service;
    })


