// =========================================================================
//  dashborad
// =========================================================================
materialAdmin
.controller('dashboardController', function ($scope, $state, hubService, $uibModal) {

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
        $state.go('reader', params, {reload: true, notify: true});
    }

    $scope.addAgent = function (ev) {

        var modalInstance = $uibModal.open({
            templateUrl: 'template/addOrEditAgentDialog.html',
            controller: 'addOrEditAgentDialogController',
            resolve: {
                isEditing: function () {
                    return false;
                },
                agent: function () {
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
                agent: function () {
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
