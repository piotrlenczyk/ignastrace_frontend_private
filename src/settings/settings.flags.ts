/**
 * How a switch is read, in the two places a switch comes from: an environment
 * variable, and the cookie that overrides one.
 *
 * Both live here rather than beside the reads in `settings.server.ts`, because
 * the vocabulary is the part a call site must not reinvent — a flag that is
 * spelled one way in the Helm chart and read another way in code is off, and
 * nothing says so.
 */

const ON = ['1', 'true'];
const OFF = ['0', 'false'];

/**
 * Whether an environment variable spells a switch that is on.
 *
 * Deliberately liberal: this repository's own configuration says `true` (the
 * Helm chart and the GitHub workflows both), while the resumewise configuration
 * these settings are modelled on says `1`. Accepting both is what keeps a value
 * carried over from either place from reading as off — which, with the
 * fail-closed defaults, is a silent loss of a feature rather than an error.
 *
 * Anything else is off. There is no third answer here: a variable that is set to
 * something unreadable is not a reason to guess.
 */
export const isFlagOn = (value: string | undefined): boolean => ON.includes(value?.toLowerCase() ?? '');

/**
 * A switch resolved against the cookie that may override it.
 *
 * The override is tri-state where the environment variable is binary: on, off,
 * or absent — and only the third case defers to the source. That is what lets
 * one cookie turn a feature on where the source says off *and* off where the
 * source says on, which is the whole point of having it.
 *
 * A cookie carrying anything else defers to the source too. A typo in a QA
 * cookie should leave the application behaving as configured.
 */
export const resolveFlag = ({ override, source }: { override: string | undefined; source: boolean }): boolean => {
  const value = override?.toLowerCase() ?? '';

  if (ON.includes(value)) {
    return true;
  }

  if (OFF.includes(value)) {
    return false;
  }

  return source;
};
