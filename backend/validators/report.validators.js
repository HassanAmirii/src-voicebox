import Joi from "joi";

export const validateCreateReport = Joi.object({
  title: Joi.string().min(20).max(30).required().message({
    "string.min": "Title must be at least 10 characters long",
    "string.max":
      "limit title to 30 characters, you can espress more in comment section",
  }),
  identity: Joi.string().min(15).message({
    "string.min": "please provide enough data to best figure out your identity",
  }),
  comment: Joi.string().min(150).required(true).message({
    "string.min":
      "Please describe the incident in more detail (150 chars min) to help us take action.",
  }),
  tags: Joi.array()
    .items(
      Joi.string().valid(
        "Assault",
        "Mockery",
        "Unfair Academic Challenge",
        "Class Disturbance",
        "Harassment",
        "Bullying",
        "Discrimination",
        "Lab Safety",
        "Hostel Safety",
        "Lecturer Misconduct",
        "Peer Threat",
        "Mental Health Distress",
      ),
    )
    .min(1)
    .required()
    .messages({
      "array.min": "you must select atleast one tag",
      "any.required": "you must select atleast one tag",
    }),
});
