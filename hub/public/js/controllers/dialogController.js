// =========================================================================
// Add or edit agent dialog controller
// =========================================================================
materialAdmin
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