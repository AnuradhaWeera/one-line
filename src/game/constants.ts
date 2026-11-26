/** Logical world size. Everything in src/game uses these units; the renderer scales to the screen. */
export const W = 360;
export const H = 640;

export const LINE_W = 8;
export const DOT_R = 16;
export const BALL_R = 11;

/** Physics, per 60 Hz tick. */
export const GRAVITY = 0.32;
export const RESTITUTION = 0.25;
export const MAX_SPEED = 16;
export const PHYSICS_SUBSTEPS = 6;
export const MAX_SIM_TICKS = 900;
export const STUCK_TICKS = 60;

/** Minimum distance between recorded stroke points. */
export const MIN_POINT_GAP = 3;

/** Lasso closing rules. */
export const LASSO_MIN_INK = 150;
export const LASSO_AUTO_CLOSE = 16;
export const LASSO_CLOSE = 34;

/** Star thresholds: fraction of the ink budget used. */
export const STAR3_MAX_INK = 0.7;
export const STAR2_MAX_INK = 0.85;

/** Guide levels: the ball ending this close to the cup counts as a near miss. */
export const NEAR_MISS_DIST = 75;
