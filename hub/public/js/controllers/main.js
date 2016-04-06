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
    // Add or edit agent dialog controller
    // =========================================================================
    .controller('readerController', function ($scope, $stateParams, $timeout,growlService) {

        $scope.ip = $stateParams.ip;
        $scope.name = $stateParams.name;
        $scope.current = null;
        $scope.interval = -1;
        $scope.isReading = false;
        $scope.elapse = 0;

        $scope.experiments = [];
        $scope.focusOn = null;

        var db = new PouchDB('tagsee');

        $scope.load = function () {
            db.query(function(doc){
                if(doc.mode==0){
                    emit(doc.id);
                }
            },{include_docs:true}).then(function(result){

                $scope.experiments = [];

                console.log(result);
                result.rows.forEach(function(row){
                    $scope.experiments.push(row.doc);
                },function(result){
                    console.log(result);
                })

                $scope.$apply();
            })

        }

        $scope.load();

        $scope.cleandb = function(){
            swal({   title: "Are you sure to delete the database? ",
                text: "All experiment records and readings will be deleted.",
                type: "warning",   showCancelButton: true,   confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete it!",   closeOnConfirm: false },
                function(){
                    db.destroy().then(function(){
                        db = new PouchDB('tagsee');
                        $scope.load();
                        swal("Deleted!", "The database is cleaned.", "success");

                    })
                })
        }


        $scope.focus = function(experiment){
            $scope.focusOn = experiment;
            for(var i=0;i<$scope.experiments.length;i++){
                $scope.experiments[i].current = false;
            }
            $scope.focusOn.current = true;
            growlService.growl('Focus on experiment ('+experiment.marker+')', 'success');
        }

        $scope.startTimer = function(){
            $timeout(function(){
                $scope.elapse = $scope.elapse+1;
                if($scope.isReading){
                    $scope.startTimer();
                }
            },1000);
        }

        $scope.discard = function(experiment){

            swal({title: "Are you sure? ",
                    text: "All readings related to this experiment will be deleted.",
                    type: "warning",   showCancelButton: true,   confirmButtonColor: "#DD6B55",
                    confirmButtonText: "Yes, delete it!",   closeOnConfirm: false },
                function(){
                    console.log(experiment);
                    db.remove(experiment._id,experiment._rev,function(){
                        $scope.load();
                        swal("Deleted!", "This experiment is deleted.", "success");
                    })
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
                    title: "Give a marker to this experiment.", 
                    type: "input", showCancelButton: true,
                    closeOnConfirm: true, animation: "slide-from-top",
                    inputPlaceholder: "Experiment marker"
                },
                function (inputValue) {
                    if (inputValue === false){
                        return false;
                    }
                    if(!inputValue){
                        inputValue = "Unknown";
                    }
                    $scope.current.marker = inputValue;


                    if (interval <0) {
                        //TODO handle the customized interval
                    }else if(interval>0){
                        $scope.current.startTime = new Date().getTime();
                        $scope.interval = interval;
                        $scope.isReading = true;
                        $scope.elapse = 0;
                        $scope.startTimer();
                        $timeout(function(){
                            $scope.stop();
                        },interval*1000);
                    }else{
                        $scope.isReading = true;
                        $scope.elapse = 0;
                        $scope.startTimer();
                        $scope.current.startTime = new Date().getTime();
                    }
                });


        }

        $scope.stop = function(){
            $scope.current.endTime = new Date().getTime();
            $scope.isReading = false;
            $scope.current.interval = $scope.current.endTime - $scope.current.startTime;
            $scope.current.amount = 0;
            $scope.current.mode = 0;
            $scope.current.ip = $scope.ip;
            db.post($scope.current).then(function(result){
                console.log(result);
                $scope.current.id = result.id;
                $scope.load();

            },function(result){
                sweetAlert("Oops...Something wrong!", result, "error");
            });
        }

        $scope.filterExperiment = function(experiment){

            if(experiment.current) return true;

            var result = experiment.ip === $scope.ip;
            if($scope.expFilter && experiment.marker){
                result &= experiment.marker.toLowerCase().indexOf($scope.expFilter.toLowerCase())>=0
            }
            return result;
        }

    })

