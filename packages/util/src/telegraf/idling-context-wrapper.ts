import {Context} from '@sesuritu/types/src';

type CtxFun<T> = (ctx: Context) => Promise<T>;

export const wrapTelegrafContextWithIdling = <T>(fun: CtxFun<T>): CtxFun<T> => {
  return (ctx: Context) => {
    return ctx.appContext.idling.wrapTask(() => fun(ctx));
  };
};
