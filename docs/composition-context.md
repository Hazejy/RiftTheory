# Contextual composition capabilities

## Principle

A champion can provide a capability in theory while the surrounding draft
makes that capability harder, less safe, or less reliable to execute.
Composition Debt must therefore become context-aware rather than treating
capability tags as final conclusions.

## Assessment layers

1. **Capability presence:** Does the champion provide the capability at all?
2. **Capability strength:** How strong is it under ordinary conditions?
3. **Enemy denial:** How can the opposing composition restrict it?
4. **Allied enablement:** How can allied champions create access or safety?
5. **Execution fit:** Can the specific player or team execute it reliably?
6. **Evidence and confidence:** What supports the assessment, and how certain is it?

The current binary baseline implements only capability presence.

## Example hypothesis

Anivia may provide wave clear, but an opposing range advantage may reduce how
safely she can reach and control the wave. Allied frontline, engage, vision,
or other forms of space creation may restore some of that access.

This is a contextual coaching hypothesis, not a permanent claim that one
champion always denies another champion.

## Future direction

DraftOS should eventually calculate an effective capability assessment from:

```text
base capability
+ allied enablement
- enemy denial
adjusted for execution fit
```

The notation is conceptual. It does not define weights or imply that these
factors combine linearly.

Contextual edges must remain separate from calibrated win probabilities.
DraftOS must not translate a manually curated interaction into a precise win
chance without suitable match data, evaluation, and probability calibration.

