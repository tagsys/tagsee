materialAdmin
// =========================================================================
// Base controller for common functions
// =========================================================================

    .controller('materialadminCtrl', function ($timeout, $state, $scope, growlService) {
        //Welcome Message
        growlService.growl('Welcome back TagSee. Enjoy your research!', 'success');


        // Detact Mobile Browser
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            angular.element('html').addClass('ismobile');
        }

        // By default Sidbars are hidden in boxed layout and in wide layout only the right sidebar is hidden.
        this.sidebarToggle = {
            left: false,
            right: false
        }

        // By default template has a boxed layout
        this.layoutType = localStorage.getItem('ma-layout-status');

        // For Mainmenu Active Class
        this.$state = $state;

        //Close sidebar on click
        this.sidebarStat = function (event) {
            if (!angular.element(event.target).parent().hasClass('active')) {
                this.sidebarToggle.left = false;
            }
        }

        //Listview Search (Check listview pages)
        this.listviewSearchStat = false;

        this.lvSearch = function () {
            this.listviewSearchStat = true;
        }

        //Listview menu toggle in small screens
        this.lvMenuStat = false;

        //Blog
        this.wallCommenting = [];

        this.wallImage = false;
        this.wallVideo = false;
        this.wallLink = false;

        //Skin Switch
        this.currentSkin = 'blue';

        this.skinList = [
            'lightblue',
            'bluegray',
            'cyan',
            'teal',
            'green',
            'orange',
            'blue',
            'purple'
        ]

        this.skinSwitch = function (color) {
            this.currentSkin = color;
        }

    })


    // =========================================================================
    // Header
    // =========================================================================
    .controller('headerCtrl', function ($timeout, messageService) {


        // Top Search
        this.openSearch = function () {
            angular.element('#header').addClass('search-toggled');
            angular.element('#top-search-wrap').find('input').focus();
        }

        this.closeSearch = function () {
            angular.element('#header').removeClass('search-toggled');
        }

        // Get messages and notification for header
        this.img = messageService.img;
        this.user = messageService.user;
        this.user = messageService.text;

        this.messageResult = messageService.getMessage(this.img, this.user, this.text);


        //Clear Notification
        this.clearNotification = function ($event) {
            $event.preventDefault();

            var x = angular.element($event.target).closest('.listview');
            var y = x.find('.lv-item');
            var z = y.size();

            angular.element($event.target).parent().fadeOut();

            x.find('.list-group').prepend('<i class="grid-loading hide-it"></i>');
            x.find('.grid-loading').fadeIn(1500);
            var w = 0;

            y.each(function () {
                var z = $(this);
                $timeout(function () {
                    z.addClass('animated fadeOutRightBig').delay(1000).queue(function () {
                        z.remove();
                    });
                }, w += 150);
            })

            $timeout(function () {
                angular.element('#notifications').addClass('empty');
            }, (z * 150) + 200);
        }

        // Clear Local Storage
        this.clearLocalStorage = function () {

            //Get confirmation, if confirmed clear the localStorage
            swal({
                title: "Are you sure?",
                text: "All your saved localStorage values will be removed",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#F44336",
                confirmButtonText: "Yes, delete it!",
                closeOnConfirm: false
            }, function () {
                localStorage.clear();
                swal("Done!", "localStorage is cleared", "success");
            });

        }

        //Fullscreen View
        this.fullScreen = function () {
            //Launch
            function launchIntoFullscreen(element) {
                if (element.requestFullscreen) {
                    element.requestFullscreen();
                } else if (element.mozRequestFullScreen) {
                    element.mozRequestFullScreen();
                } else if (element.webkitRequestFullscreen) {
                    element.webkitRequestFullscreen();
                } else if (element.msRequestFullscreen) {
                    element.msRequestFullscreen();
                }
            }

            //Exit
            function exitFullscreen() {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            }

            if (exitFullscreen()) {
                launchIntoFullscreen(document.documentElement);
            }
            else {
                launchIntoFullscreen(document.documentElement);
            }
        }

    })


    // =========================================================================
    // Hub dashborad
    // =========================================================================

    .controller('hubController', function ($scope, $state, hubService, $uibModal, growlService) {

        $scope.discover = function () {
            hubService.discover().then(function (result) {
                $scope.agents = result.agents;
                console.log(result);
            }, function (data) {
                console.log(data);
            });
        }

        $scope.discover();

        $scope.$on('discover', function () {
            $scope.discover();
        })


        $scope.go = function (params) {
            $state.go('reader', params,{reload: true, notify: true});
        }

        $scope.addAgent = function (ev) {
        	
        	var modalInstance = $uibModal.open({
        	      templateUrl: 'template/addOrEditAgentDialog.html',
        	      controller: 'addOrEditAgentDialogController',
        	      resolve: {
        	        isEditing: function () {
        	          return false;
        	        },
        	        agent: function(){
        	        	return null;
        	        }
        	      }
        	    });
        }

        $scope.editAgent = function (ev, agent) {


            var modalInstance = $uibModal.open({
                templateUrl: 'template/addOrEditAgentDialog.html',
                controller: 'addOrEditAgentDialogController',
                resolve: {
                    isEditing: function () {
                        return true;
                    },
                    agent: function(){
                        return agent;
                    }
                }
            });

        }

        $scope.removeAgent = function (ip) {

            swal({
                    title: "Are you sure?",
                    text: "You will not be able to recover this agent!",
                    type: "warning", showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes, delete it!",
                    closeOnConfirm: false
                },
                function () {
                    hubService.removeAgent(ip).then(function () {
                        swal("Deleted!", "The reader agent(" + ip + ") has been deleted.", "success");
                        $scope.discover();
                    }, function (result) {
                        sweetAlert("Oops...Something wrong!(errorCode=" + result.errorCode + ")", result.errorMessage, "error");
                    })
                });
        }

    })

    // =========================================================================
    // Add or edit agent dialog controller
    // =========================================================================
    .controller('addOrEditAgentDialogController', function ($scope, $rootScope, $uibModalInstance, hubService, isEditing, agent) {


        if (isEditing) {
            $scope.agent = agent;
            $scope.isEditing = true;
        } else {
            $scope.agent = {};
        }

        $scope.cancel = function () {
        	$uibModalInstance.dismiss('cancel');
        }

        $scope.ok = function (agent) {


            if (!agent.ip) {
                sweetAlert("Oops...", "IP cannot be empty!", "error");
                return;
            }

            if (/^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])(\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])){3}$/.test(agent.ip) == false) {
                sweetAlert("Oops...", 'The format of IP is not correct!', 'error');
                return;
            }

            if (!agent.name) {
                sweetAlert("Oops...", 'Name cannot be empty.', 'error');
                return;
            }

            $uibModalInstance.close(agent);

            if (!$scope.isEditing) {

                hubService.createAgent(agent.ip, agent.name, agent.remark)
                    .then(function (result) {
                        console.log(result);
                        $rootScope.$broadcast('discover');
                    }, function (result) {
                        sweetAlert("Oops...Something wrong!(errorCode=" + result.errorCode + ")", result.errorMessage, "error");
                    });
            } else {
                hubService.updateAgent(agent.ip, agent.name, agent.remark)
                    .then(function (result) {
                        console.log(result);
                        $rootScope.$broadcast('discover');
                    }, function (result) {
                        sweetAlert("Oops...Something wrong!(errorCode=" + result.errorCode + ")", result.errorMessage, "error");
                    });
            }
        }
    })
    // =========================================================================
    // Reader controller
    // =========================================================================
    .controller('readerController', function ($scope,$state, $stateParams, $timeout,$filter,growlService, dataService,ngTableParams) {

        $scope.name = $stateParams.name;
        $scope.ip = $stateParams.ip;
        $scope.current = null;
        $scope.filterWords = "";


        dataService.load(function(expCollection){

            $scope.expCollection =  expCollection;

            for(var i=0;i<expCollection.data.length;i++){
                if(expCollection.data[i].isReading){
                    $scope.current = $scope.expCollection.data[i];
                    break;
                }
            }

            console.log($scope.current);

            // expCollection.on('update',function(){
            //     $scope.refresh();
            // })
            expCollection.on('insert',function(){
                $scope.refresh();
            })
            $scope.refresh();
        });


        $scope.expTablePrams = new ngTableParams({page: 1, count: 10, sorting: {$loki: 'desc'}},
            {
                getData: function($defer, params){
                    if(!$scope.expCollection){
                        return;
                    }

                    var chain = $scope.expCollection.chain()
                        .where(function (exp) {
                            return exp.ip === $scope.ip && exp.marker.indexOf($scope.filterWords)>=0;
                        });
                    params.total(chain.data().length);

                    chain = chain
                        .simplesort(params.orderBy()[0].substring(1),params.orderBy()[0].indexOf('-')==0)
                        .offset((params.page()-1)*params.count())
                        .limit(params.count());

                    $defer.resolve(chain.data(), params.page() * params.count());

                    // var orderedData = params.sorting() ? $filter('orderBy')($scope.experiments, params.orderBy()) : $scope.experiments;
                    // params.total(orderedData.length);
                    // $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                }
            });

        $scope.refresh = function(){
            $scope.expTablePrams.reload();
        }


        $scope.destroy = function(){
            swal({   title: "Are you sure to delete the database? ",
                text: "All experiment records and readings will be deleted.",
                type: "warning",   showCancelButton: true,   confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete it!",   closeOnConfirm: true },
                function(input){
                    if(input == false) return;
                    dataService.destroy();
                    $scope.refresh();
                })
        }


        $scope.go = function(experiment){
            dataService.save();
            $state.go('vis',{expId:experiment.$loki, ip:$scope.ip, name:$scope.name},{reload: true, notify: true});
        }
        

        $scope.discard = function(experiment){

            swal({title: "Are you sure? ",
                    text: "All readings related to this experiment will be deleted.",
                    type: "warning",   showCancelButton: true,   confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes, delete it!",   closeOnConfirm: true },
                function(input){

                    if(!input) return false;

                    dataService.discard(experiment);

                    $scope.expTablePrams.reload();

                })
        }


        $scope.start = function (interval) {

            if($scope.isReading){
                swal("It's reading!", "Please finish current experiment firstly.", "warning");
                return;
            }

            $scope.current = {};
            var terminated = false;

            swal({
                    title: "Give a marker to identify this experiment.",
                    type: "input", showCancelButton: true,
                    closeOnConfirm: true, animation: "slide-from-top",
                    inputPlaceholder: "Experiment identifier",
                    inputValue : "exp-"+ Math.floor(Math.random()*10000)
                },
                function (inputValue) {

                    if (inputValue === false){
                        return false;
                    }
                    if(!inputValue){
                        inputValue = "exp-"+ Math.floor(Math.random()*10000);
                    }

                    dataService.begin($scope.ip, inputValue, interval, function(error, exp){
                        if(error){
                            sweetAlert("Oops...Something wrong! Error("+error.errorCode+")", error.errorMessage, "error");
                        }else {
                            console.log('begin a new experiment');
                            $scope.current = exp;
                        }
                    });
                });


        }

        $scope.stop = function(){
            if($scope.current){
            dataService.end($scope.current, function(error){
                if(error){
                    sweetAlert("Oops...Something wrong! Error("+error.errorCode+")", error.errorMessage, "error");
                }
            })
            }else{
                dataService.end($scope.ip, function(error){
                    if(error){
                        sweetAlert("Oops...Something wrong! Error("+error.errorCode+")", error.errorMessage, "error");
                    }
                })
            }
        }


    })
    // =========================================================================
    // Visulization controller
    // =========================================================================
    .controller('visController', function ($scope,$state, $stateParams, $timeout,$filter,growlService, dataService,ngTableParams) {

        $scope.expId = $stateParams.expId;
        $scope.ip = $stateParams.ip;
        $scope.name = $stateParams.name;

        $scope.exp = null;
        $scope.total = 0;
        $scope.filters = [];

        $scope.readTablePrams = new ngTableParams({page: 1, count: 10, sorting: {name: 'desc'}},
            {
                getData: function($defer, params){

                    console.log($scope.exp);

                    if($scope.exp && $scope.exp.readings) {

                        var readings = [];

                        $scope.filters = [];
                        var keys = Object.keys($scope.exp.filters);
                        if(keys){
                            for(var i=0;i<keys.length;i++){
                                var epc = keys[i];
                                $scope.filters.push({'epc':epc, filtered:$scope.exp.filters[epc]})
                            }
                        }

                        for(var i=0;i<$scope.exp.readings.length;i++){
                            var tag = $scope.exp.readings[i];
                            if($scope.exp.filters[tag.epc]){
                                readings.push(tag);
                            }
                        }

                        var orderedData = params.sorting() ? $filter('orderBy')(readings, params.orderBy()) : readings;
                        $scope.total = orderedData.length;
                        params.total(orderedData.length);
                        $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                    }

                    return null;
                }
            });

        $scope.refresh = function(){
            $scope.readTablePrams.reload();
        }

        dataService.load(function(expCollection){

            $scope.exp = dataService.get($scope.expId);

            $scope.refresh();

        });

        $scope.checkFilter = function(filter){

            $scope.exp.filters[filter.epc] = filter.filtered;

            dataService.save();

            $scope.refresh();

        }

    })
