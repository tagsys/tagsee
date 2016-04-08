materialAdmin

// =========================================================================
// Utility service
// =========================================================================

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
    // =========================================================================

    .service('dataService', function (utilService, Loki, $timeout, $websocket, $location) {

        var service = {}

        service._idbAdapter = new LokiIndexedAdapter('tagsee');
        service._db = new Loki("tagsee.json", {
            autosave: true,
            autosaveInterval: 5000,
            persistenceMethod: 'adapter',
            adapter: service._idbAdapter
        })

        service.load = function (callback) {
            service._db.loadDatabase({}, function (result) {
                service._expCollection = service._db.getCollection('exp');
                console.log(service._expCollection);
                if (!service._expCollection) {
                    service._expCollection = service._db.addCollection('exp');
                }

                callback(service._expCollection);
            });
        }



        var dataStream = $websocket('ws://'+location.host+'/socket');

        var collection = [];

        dataStream.onMessage(function(message) {
            if(!service.currentExp) {
                return;
            }

            var result = JSON.parse(message.data);
            if(result.errorCode==0){
                console.log("tags:"+result.tags);
                result.tags.forEach(function(tag){
                    service.currentExp.readings.push(tag);
                    service.currentExp.amount = service.currentExp.amount+1;
                })
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
                ip: ip,
                marker: marker,
                startTime: new Date().getTime(),
                interval: interval,
                isReading: true,
                elapse: 0, // time for the experiment.
                readings:[]
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
                service._expCollection.update(exp);
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

        service.query = function (cb, pageIndex, pageSize) {
            

        }

        service.discard = function (exp, cb) {

            service._expCollection.remove(exp);

        }

        service.destroy = function(){
            console.log('destroy....');
            service._idbAdapter.getDatabaseList(function(result) {
                // result is array of string names for that appcontext ('finance')
                result.forEach(function(str) {
                    console.log(str);
                });
            });
            service._idbAdapter.deleteDatabase("tagsee.json");
        }

        return service;
    })

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


    //==============================================
    // BOOTSTRAP GROWL
    //==============================================

    .service('growlService', function () {
        var gs = {};
        gs.growl = function (message, type) {

            $.growl({
                message: message
            }, {
                type: type,
                allow_dismiss: false,
                label: 'Cancel',
                className: 'btn-xs btn-inverse',
                placement: {
                    from: 'top',
                    align: 'center'
                },
                delay: 2500,
                animate: {
                    enter: 'animated bounceIn',
                    exit: 'animated bounceOut'
                },
                offset: {
                    x: 20,
                    y: 85
                }
            });
        }

        return gs;
    })
