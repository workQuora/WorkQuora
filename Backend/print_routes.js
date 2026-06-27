const app = require('./src/app');

function printRoutes(app) {
    const routes = [];
    app._router.stack.forEach(middleware => {
        if (middleware.route) { // routes registered directly on the app
            routes.push(`${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
        } else if (middleware.name === 'router') { // router middleware 
            middleware.handle.stack.forEach(handler => {
                let route;
                let methods = [];
                if (handler.route) {
                    route = handler.route;
                }
                if (route) {
                    const prefix = middleware.regexp.toString().replace('/^\\', '').replace('\\/?(?=\\/|$)/i', '').replace('\\/', '/');
                    const method = Object.keys(route.methods)[0].toUpperCase();
                    routes.push(`${method} ${prefix}${route.path}`);
                }
            });
        }
    });
    console.log(routes.join('\n'));
}

printRoutes(app);
