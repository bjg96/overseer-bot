import { ThrottleStrategy, ThrottleStrategyService } from "./throttle";

/**
 * the options available to the consumers
 * of your strategy.
 */
interface AndThrottleOptions<TFireFunctionParams> {
  throttles: Array<ThrottleStrategy<TFireFunctionParams>>;
}

/** 
 * This service is just a wrapper that allows you to use injected services
 * inside a throttling strategy.
 * 
 * Strategy factory for calling your function only if all throttles meet
 * firing criteria.
 */
export class AndThrottleStrategyService<TFireFunctionParams>
  implements ThrottleStrategyService<AndThrottleOptions<TFireFunctionParams>, TFireFunctionParams> {
  public getStrategy = (opts: AndThrottleOptions<TFireFunctionParams>) => {
    /**
     * This class is the actual throttling strategy, 
     * where the logic goes.
     */
    class AndThrottle implements ThrottleStrategy<TFireFunctionParams> {
      private throttles: Array<ThrottleStrategy<TFireFunctionParams>>;
      constructor(opts: AndThrottleOptions<TFireFunctionParams>) {
        this.throttles = opts.throttles;
      }
      public shouldFire = (params: TFireFunctionParams) =>
        this.throttles.every(throttle => throttle.shouldFire(params));
      public recordFire = (params: TFireFunctionParams) =>
        this.throttles.forEach(throttle => throttle.recordFire(params));
      public recordBlock = (params: TFireFunctionParams) =>
        this.throttles.forEach(throttle => throttle.recordBlock(params));
    }
    return new AndThrottle(opts);
  }
}