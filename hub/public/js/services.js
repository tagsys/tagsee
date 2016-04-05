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
    // Best Selling Widget Data (Home Page)
    // =========================================================================

    .service('bestsellingService', ['$resource', function ($resource) {
        this.getBestselling = function (img, name, range) {
            var gbList = $resource("data/best-selling.json");

            return gbList.get({
                img: img,
                name: name,
                range: range,
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
