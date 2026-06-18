/*
 * Copyright 2026 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

type Listener = () => void;

const registrations = new Map<string, Set<string>>();
const confirmations = new Map<string, Set<string>>();
const listeners = new Set<Listener>();
let version = 0;

function emit() {
  version++;
  listeners.forEach(l => l());
}

/** Register a card as showing the freshness banner for an entity. */
export function registerCard(entityName: string, cardId: string) {
  if (!registrations.has(entityName)) registrations.set(entityName, new Set());
  const set = registrations.get(entityName)!;
  if (!set.has(cardId)) {
    set.add(cardId);
    emit();
  }
}

/** Unregister a card (e.g. on unmount). */
export function unregisterCard(entityName: string, cardId: string) {
  registrations.get(entityName)?.delete(cardId);
  confirmations.get(entityName)?.delete(cardId);
  if (registrations.get(entityName)?.size === 0)
    registrations.delete(entityName);
  if (confirmations.get(entityName)?.size === 0)
    confirmations.delete(entityName);
  emit();
}

/** Mark a specific card as confirmed fresh by the user. */
export function confirmCard(entityName: string, cardId: string) {
  if (!confirmations.has(entityName)) confirmations.set(entityName, new Set());
  const set = confirmations.get(entityName)!;
  if (!set.has(cardId)) {
    set.add(cardId);
    emit();
  }
}

/**
 * Returns the fraction of registered cards that have been confirmed (0-1).
 * If no cards are registered, returns 0.
 */
export function getFreshnessFraction(entityName: string): number {
  const total = registrations.get(entityName)?.size ?? 0;
  if (total === 0) return 0;
  const confirmed = confirmations.get(entityName)?.size ?? 0;
  return confirmed / total;
}

/** Subscribe to store changes (for useSyncExternalStore). */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Snapshot value that changes on every mutation (for useSyncExternalStore). */
export function getSnapshot(): number {
  return version;
}
