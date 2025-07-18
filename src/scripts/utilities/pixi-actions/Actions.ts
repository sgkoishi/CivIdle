import type * as PIXI from "pixi.js";
import type { Action } from "./Action";
import { actions } from "./ActionStorage";
import type { EasingFunction } from "./Easing";
import { Easing } from "./Easing";
import Delay from "./actions/Delay";
import Parallel from "./actions/Parallel";
import Repeat from "./actions/Repeat";
import RunFunc from "./actions/RunFunc";
import Sequence from "./actions/Sequence";
import { TargetAction } from "./actions/TargetAction";

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class Actions {
   static to<T extends Record<string, any>>(
      target: T,
      targetValue: Partial<Record<keyof T, any>>,
      seconds: number,
      interpolation: EasingFunction = Easing.Linear,
   ): Action {
      return new TargetAction(target, targetValue, seconds, interpolation);
   }

   static remove(target: PIXI.DisplayObject): Action {
      return Actions.runFunc(() => {
         if (target.parent != null) target.parent.removeChild(target);
      });
   }

   static delay(seconds: number): Action {
      return new Delay(seconds);
   }

   static runFunc(fn: () => void): Action {
      return new RunFunc(fn);
   }

   static sequence(...actions: Array<Action>): Action {
      return new Sequence(...actions);
   }

   static parallel(...actions: Array<Action>): Action {
      return new Parallel(...actions);
   }

   static repeat(action: Action, times = -1): Action {
      return new Repeat(action, times);
   }

   static start(action: Action) {
      actions.set(action.id, action);
   }

   static isPlaying(action: Action): boolean {
      return actions.has(action.id);
   }

   static pause(action: Action) {
      actions.delete(action.id);
   }

   static clear(target: object) {
      for (const [id, action] of actions) {
         if (action instanceof TargetAction && action.target === target) {
            actions.delete(id);
         }
      }
   }

   static tick(delta: number) {
      for (const [id, action] of actions) {
         const done = action.tick(delta);
         if (done) {
            action.done = true;
            actions.delete(id);
            // Are there any queued events?
            for (let j = 0; j < action.queued.length; j++) {
               Actions.start(action.queued[j]);
            }
            action.queued = [];
         }
      }
   }
}
