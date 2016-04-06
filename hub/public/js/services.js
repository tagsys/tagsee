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

        service.createAgent = function(ip,name,remark){

            return utilService.post("/service/agent/create",{
                ip:ip,name:name,remark:remark
            });
        }

        service.updateAgent = function(ip,name,remark){
            return utilService.post("/service/agent/"+ip+"/update",{
                name:name, remark:remark
            });
        }
        
        service.removeAgent = function(ip){
        	return utilService.post("/service/agent/"+ip+"/remove");
        }

        service.startAgent = function(ip){
            return utilService.get("service/agent/"+ip+"/start");
        }
        
    

        return service;
    })
    .service('expService',function(){

        var service = {
             db : new PouchDB('tagsee')
        };

        var startTimer = function(exp){
            $timeout(function(){
                exp.elapse = exp.elapse+1;
                if(exp.interval>0 && exp.elapse>exp.interval){
                    service.end();
                }
                if(exp.isReading){
                    startTimer(exp);
                }
            },1000);
        }

        service.begin = function(ip,marker,interval){
            var exp = {
                ip: ip,
                marker:marker,
                startTime: new Date().getTime(),
                interval:interval,
                isReading:true,
                elapse: 0, // time for the experiment.
                mode: 0 // experiment or reading.
            };

            db.post(exp).then(function(result){
                exp._id = result.id;
                exp._rev = result.rev;
                $scope.current = exp;
                $scope.load();
                startTimer(exp);
            },function(result){
                exp.errorCode = result.errorCode;
                sweetAlert("Oops...Something wrong!", result, "error");
            });
        }

        service.end = function(exp, cb){
            exp.isReading = false;
            exp.endTime = new Date().getTime();
            db.post( exp).then(function(result){
                if(cb) cb();
            },function(result){
                sweetAlert("Oops...Something wrong!", result, "error");
            });
        }

        service.query = function(cb, pageIndex, pageSize){

        }

        service.discard = function(exp, cb){
            swal({title: "Are you sure? ",
                    text: "All readings related to this experiment will be deleted.",
                    type: "warning",   showCancelButton: true,   confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes, delete it!",   closeOnConfirm: false },
                function(){
                    db.remove(exp._id,exp._rev,function(){
                        $scope.load();
                        swal("Deleted!", "This experiment is deleted.", "success");
                    })
                })
        }

        return service;
    })
    .service('readService', function(){

        var service = {
            db : new PouchDB('tagsee')
        };

        service.addRead = function(exp,tag){

        }

        service.download = function(expId){

        }

        service.query = function(expId){

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
