import mongoose from "mongoose";
import Report from "../models/report.models.js";
export const createReport = async (req, res, next) => {
  try {
    const { title, tags, identity, comment, status, adminNote } = req.body;
    await Report.create({
      title,
      tags,
      identity,
      comment,
      status,
      adminNote,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllReports = async (req, res, next) => {
  const reports = Report.find({});
};
