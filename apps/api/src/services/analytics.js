import mongoose from 'mongoose';
import { PurchaseOrder, Sale } from '../models/index.js';

export function buildVatReturnUnionPipeline({ tenantId, from, to }) {
  const startDate = new Date(from);
  const endDate = new Date(to);

  return [
    {
      $match: {
        tenantId: new mongoose.Types.ObjectId(tenantId),
        soldAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['COMPLETED', 'QUEUED_OFFLINE'] },
      },
    },
    {
      $project: {
        source: { $literal: 'sale' },
        outputVat: '$vatTotal',
        inputVat: { $literal: 0 },
      },
    },
    {
      $unionWith: {
        coll: PurchaseOrder.collection.name,
        pipeline: [
          {
            $match: {
              tenantId: new mongoose.Types.ObjectId(tenantId),
              createdAt: { $gte: startDate, $lte: endDate },
              status: { $in: ['RECEIVED', 'PARTIALLY_RECEIVED'] },
            },
          },
          {
            $project: {
              source: { $literal: 'purchase' },
              outputVat: { $literal: 0 },
              inputVat: '$vatTotal',
            },
          },
        ],
      },
    },
    {
      $group: {
        _id: null,
        totalOutputVat: { $sum: '$outputVat' },
        totalInputVat: { $sum: '$inputVat' },
      },
    },
    {
      $project: {
        _id: 0,
        totalOutputVat: { $round: ['$totalOutputVat', 2] },
        totalInputVat: { $round: ['$totalInputVat', 2] },
        netVatDue: { $round: [{ $subtract: ['$totalOutputVat', '$totalInputVat'] }, 2] },
      },
    },
  ];
}

export async function calculateVatReturn({ tenantId, from, to }) {
  const [result] = await Sale.aggregate(buildVatReturnUnionPipeline({ tenantId, from, to }));

  return (
    result || {
      totalOutputVat: 0,
      totalInputVat: 0,
      netVatDue: 0,
    }
  );
}
