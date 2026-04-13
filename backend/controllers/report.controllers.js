import mongoose from "mongoose";
import Report from "../models/report.models.js";
import { validateCreateReport } from "../validators/report.validators.js";
export const createReport = async (req, res, next) => {
  try {
    const { error } = validateCreateReport.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { title, tags, identity, comment } = req.body;
    await Report.create({
      title,
      tags,
      identity,
      comment,
    });

    return res.status(201).json({ success: true, message: "report submitted" });
  } catch (error) {
    next(error);
  }
};

export const getAllReports = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const [reports, totalReports] = await Promise.all([
      Report.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Report.countDocuments({}),
    ]);

    const totalPages = Math.ceil(totalReports / limit);

    return res.status(200).json({
      success: true,
      reports,
      pagination: {
        totalReports,
        currentPage: page,
        totalPages,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};
