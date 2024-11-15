import { Router } from 'express';
import { healthcheck } from '../controllers/healthcheck.controller';

const router = Router({mergeParams: true});

router.get("/", healthcheck)
export default router