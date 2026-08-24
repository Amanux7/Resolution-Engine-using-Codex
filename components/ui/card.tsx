import type { HTMLAttributes } from "react";
import { clsx } from "clsx";
export function Card({className,...props}:HTMLAttributes<HTMLDivElement>){return <div className={clsx("rounded-2xl border border-line bg-white shadow-soft",className)} {...props}/>;}
export function CardHeader({className,...props}:HTMLAttributes<HTMLDivElement>){return <div className={clsx("border-b border-line px-5 py-4 sm:px-6",className)} {...props}/>;}
export function CardContent({className,...props}:HTMLAttributes<HTMLDivElement>){return <div className={clsx("px-5 py-5 sm:px-6",className)} {...props}/>;}
