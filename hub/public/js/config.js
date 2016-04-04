materialAdmin
    .config(function ($stateProvider, $urlRouterProvider){
        $urlRouterProvider.otherwise("/home");


        $stateProvider
        
            //------------------------------
            // HOME
            //------------------------------
            .state ('home', {
                url: '/home',
                templateUrl: 'views/home.html'
            });
    });
