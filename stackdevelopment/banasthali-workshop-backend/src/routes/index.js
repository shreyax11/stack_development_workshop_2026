import express from "express";
import userRoutes from "./user.js";
import projectRoutes from "./project.js";
import adminRoutes from "./admin.js";

const router = express.Router();

const routes = [
    {
        route: '/user',
        handler: userRoutes
    },
    {
        route: '/project',
        handler: projectRoutes
    },
    {
        route: '/admin',
        handler: adminRoutes
    }
]

routes.forEach((route) => {
    router.use(route.route, route.handler);
});

router.get('/health', (req, res) => {
  res.send('ok');
});

export default router;