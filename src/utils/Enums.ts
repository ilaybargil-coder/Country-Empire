export enum GuestState {
  SPAWN             = 'SPAWN',
  DECIDE            = 'DECIDE',
  WALKING_TO_PATH   = 'WALKING_TO_PATH',
  WALKING_TO_SLOT   = 'WALKING_TO_SLOT',
  USING_FACILITY    = 'USING_FACILITY',
  PAYING            = 'PAYING',
  LEAVING           = 'LEAVING',
}

export enum GuestMood {
  HAPPY   = 'HAPPY',
  NEUTRAL = 'NEUTRAL',
  SAD     = 'SAD',
}

export enum GuestOutfit {
  GYM  = 'GYM',
  SWIM = 'SWIM',
}

export enum FacilityType {
  GYM  = 'GYM',
  POOL = 'POOL',
  SPA  = 'SPA',
}

export enum WalkPose {
  STAND = 'STAND',
  WALK0 = 'WALK0',
  WALK1 = 'WALK1',
  LIFT0 = 'LIFT0',
  LIFT1 = 'LIFT1',
  SWIM0 = 'SWIM0',
  SWIM1 = 'SWIM1',
}
