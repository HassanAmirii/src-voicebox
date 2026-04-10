/*
 
/complain: model 
title string
tags : enum{}
comment: string
identity: string 
attribute : Enum [queue, handled, unhandled]
            default: unhandled
admin_note: string
date.now()

 */

import mongoose from "mongoose";

const complainShema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: [20, "Title must be at least 10 characters long"],
    maxlength: [30, "limit title to 30 characters, you can espress more in comment section"]
    trim: true,
  },
  tags: {
    type: [String]
    required: true,
    enum: [
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
    ],
    validate: {
      validator: function(pickedTag){
       return Array.isArray(pickedTag) && pickedTag.length > 0
      },
      message: 'you must select atleast one tag'
    }
  },
  identity: {
    type: String,
    default: "Anonymous",
    required: true,
    trim: true,
  },
  comment: {
    type: String,
   minlength: [150, 'Please describe the incident in more detail (150 chars min) to help us take action.'],
    required: true,
    trim: true,
  },
}, {timestamps: true});
