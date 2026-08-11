import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDeviceId() {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('awavox_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('awavox_device_id', id);
  }
  return id;
}
