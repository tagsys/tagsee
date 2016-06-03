// =========================================================================
// Reader controller
// =========================================================================
materialAdmin.controller('readerController', function ($scope, $state, $stateParams, $timeout, $filter, dataService, ngTableParams) {

    $scope.name = $stateParams.name;
    $scope.ip = $stateParams.ip;
    $scope.current = null;
    $scope.filterWords = "";

    $scope.expTablePrams = new ngTableParams({page: 1, count: 10, sorting: {$loki: 'desc'}},
        {
            getData: function ($defer, params) {
                if (!$scope.expCollection) {
                    return;
                }

                var chain = $scope.expCollection.chain()
                    .where(function (exp) {
                        return exp.ip === $scope.ip && exp.marker.indexOf($scope.filterWords) >= 0;
                    });
                params.total(chain.data().length);

                chain = chain
                    .simplesort(params.orderBy()[0].substring(1), params.orderBy()[0].indexOf('-') == 0)
                    .offset((params.page() - 1) * params.count())
                    .limit(params.count());

                $defer.resolve(chain.data(), params.page() * params.count());
            }
        });

    $scope.refresh = function () {
        $scope.expTablePrams.reload();
    }

    dataService.load(function (expCollection) {

        $scope.expCollection = expCollection;

        for (var i = 0; i < expCollection.data.length; i++) {
            if (expCollection.data[i].isReading) {
                $scope.current = $scope.expCollection.data[i];
                break;
            }
        }

        expCollection.on('update', function () {
            if (!$scope.$$phase) {
                $scope.$apply();
            }
            $scope.refresh();

        })
        expCollection.on('insert', function () {
            $scope.refresh();
        })
        $scope.refresh();


    });

    $scope.destroy = function () {
        swal({
                title: "Are you sure to delete the database? ",
                text: "All experiment records and readings will be deleted.",
                type: "warning", showCancelButton: true, confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete it!", closeOnConfirm: true
            },
            function (input) {
                if (input == false) return;
                dataService.destroy();
                $scope.refresh();
            })
    }


    $scope.go = function (experiment) {
        dataService.save();
        $state.go('vis', {expId: experiment.$loki, ip: $scope.ip, name: $scope.name}, {reload: true, notify: true});
    }


    $scope.discard = function (experiment) {

        swal({
                title: "Are you sure? ",
                text: "All readings related to this experiment will be deleted.",
                type: "warning", showCancelButton: true, confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, delete it!", closeOnConfirm: true
            },
            function (input) {

                if (!input) return false;

                dataService.discard(experiment);

                $scope.expTablePrams.reload();

            })
    }


    $scope.start = function (interval) {

        if ($scope.isReading) {
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
                inputValue: "exp-" + Math.floor(Math.random() * 10000)
            },
            function (inputValue) {

                if (inputValue === false) {
                    return false;
                }
                if (!inputValue) {
                    inputValue = "exp-" + Math.floor(Math.random() * 10000);
                }

                dataService.begin($scope.ip, inputValue, interval, function (error, exp) {
                    if (error) {
                        sweetAlert("Oops...Something wrong! Error(" + error.errorCode + ")", error.errorMessage, "error");
                    } else {
                        console.log('begin a new experiment');
                        $scope.current = exp;
                    }
                });
            });


    }

    $scope.stop = function () {
        if ($scope.current) {
            dataService.end($scope.current, function (error) {
                if (error) {
                    sweetAlert("Oops...Something wrong! Error(" + error.errorCode + ")", error.errorMessage, "error");
                }
            })
        } else {
            dataService.end($scope.ip, function (error) {
                if (error) {
                    sweetAlert("Oops...Something wrong! Error(" + error.errorCode + ")", error.errorMessage, "error");
                }
            })
        }
    }

    $scope.terminate = function(exp){

        swal({   title: "Are you sure?",
                text: "You will forcedly terminate the reading! This action will not seed close command to reader.",
                type: "warning",   showCancelButton: true,
                confirmButtonColor: "#DD6B55",   confirmButtonText: "Yes",
                cancelButtonText: "No",   closeOnConfirm: true,   closeOnCancel: true },
            function(isConfirm){
                if (isConfirm) {
                    exp.isReading = false;
                    dataService.save();
                } else {
                    //ignore it.
                }
            });

    }

    $scope.configure = function(){

        sweetAlert("Oops...", "The function of configuring reader will be implemented in the next version", "error");

    }



})