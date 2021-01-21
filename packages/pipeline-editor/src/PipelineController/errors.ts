export class ElyraOutOfDateError extends Error {
  constructor() {
    super(
      "Pipeline was last edited in a newer version of Elyra. Update Elyra to use this pipeline."
    );
  }
}

export class PipelineOutOfDateError extends Error {
  constructor() {
    super("Pipeline is out of date.");
  }
}

export class UnknownVersionError extends Error {
  constructor() {
    super("Pipeline has an unrecognizable version.");
  }
}
