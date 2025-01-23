import { Service } from '@n8n/di';
import { DataSource, In, Not, Repository } from '@n8n/typeorm';
import type { DeepPartial } from '@n8n/typeorm/common/DeepPartial';
import type { IDataObject } from 'n8n-workflow';

import { TestCaseExecution } from '@/databases/entities/test-case-execution.ee';
import type { TestCaseExecutionErrorCode } from '@/evaluation.ee/test-runner/errors.ee';

@Service()
export class TestCaseExecutionRepository extends Repository<TestCaseExecution> {
	constructor(dataSource: DataSource) {
		super(TestCaseExecution, dataSource.manager);
	}

	async createBatch(testRunId: string, pastExecutionIds: string[]) {
		const mappings = this.create(
			pastExecutionIds.map<DeepPartial<TestCaseExecution>>((id) => ({
				testRun: {
					id: testRunId,
				},
				pastExecution: {
					id,
				},
				status: 'new',
			})),
		);

		return await this.save(mappings);
	}

	async markAsRunning(testRunId: string, pastExecutionId: string, executionId: string) {
		return await this.update(
			{ testRun: { id: testRunId }, pastExecutionId },
			{
				status: 'running',
				executionId,
				runAt: new Date(),
			},
		);
	}

	async markAsEvaluationRunning(
		testRunId: string,
		pastExecutionId: string,
		evaluationExecutionId: string,
	) {
		return await this.update(
			{ testRun: { id: testRunId }, pastExecutionId },
			{
				status: 'evaluation_running',
				evaluationExecutionId,
			},
		);
	}

	async markAsCompleted(
		testRunId: string,
		pastExecutionId: string,
		metrics: Record<string, number>,
	) {
		return await this.update(
			{ testRun: { id: testRunId }, pastExecutionId },
			{
				status: 'success',
				completedAt: new Date(),
				metrics,
			},
		);
	}

	async markPendingAsCancelled(testRunId: string) {
		return await this.update(
			{ testRun: { id: testRunId }, status: Not(In(['success', 'error', 'cancelled'])) },
			{
				status: 'cancelled',
				completedAt: new Date(),
			},
		);
	}

	async markAsFailed(
		testRunId: string,
		pastExecutionId: string,
		errorCode?: TestCaseExecutionErrorCode,
		errorDetails?: IDataObject,
	) {
		return await this.update(
			{ testRun: { id: testRunId }, pastExecutionId },
			{
				status: 'error',
				completedAt: new Date(),
				errorCode,
				errorDetails,
			},
		);
	}

	async markAsWarning(
		testRunId: string,
		pastExecutionId: string,
		errorCode?: TestCaseExecutionErrorCode,
		errorDetails?: IDataObject,
	) {
		return await this.update(
			{ testRun: { id: testRunId }, pastExecutionId },
			{
				status: 'warning',
				completedAt: new Date(),
				errorCode,
				errorDetails,
			},
		);
	}
}
