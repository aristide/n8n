import { Column, Entity, Index, ManyToOne, RelationId } from '@n8n/typeorm';
import { IDataObject } from 'n8n-workflow';

import {
	datetimeColumnType,
	jsonColumnType,
	WithTimestampsAndStringId,
} from '@/databases/entities/abstract-entity';
import { TestDefinition } from '@/databases/entities/test-definition.ee';
import type { TestRunErrorCode } from '@/evaluation.ee/test-runner/errors.ee';

type TestRunStatus = 'new' | 'running' | 'completed' | 'error' | 'cancelled';

export type AggregatedTestRunMetrics = Record<string, number | boolean>;

/**
 * Entity representing a Test Run.
 * It stores info about a specific run of a test, combining the test definition with the status and collected metrics
 */
@Entity()
@Index(['testDefinition'])
export class TestRun extends WithTimestampsAndStringId {
	@ManyToOne('TestDefinition', 'runs')
	testDefinition: TestDefinition;

	@RelationId((testRun: TestRun) => testRun.testDefinition)
	testDefinitionId: string;

	@Column('varchar')
	status: TestRunStatus;

	@Column({ type: datetimeColumnType, nullable: true })
	runAt: Date | null;

	@Column({ type: datetimeColumnType, nullable: true })
	completedAt: Date | null;

	@Column(jsonColumnType, { nullable: true })
	metrics: AggregatedTestRunMetrics;

	/**
	 * Total number of the test cases, matching the filter condition of the test definition (specified annotationTag)
	 */
	@Column('integer', { nullable: true })
	totalCases: number;

	/**
	 * Number of test cases that passed (evaluation workflow was executed successfully)
	 */
	@Column('integer', { nullable: true })
	passedCases: number;

	/**
	 * Number of failed test cases
	 * (any unexpected exception happened during the execution or evaluation workflow ended with an error)
	 */
	@Column('integer', { nullable: true })
	failedCases: number;

	/**
	 * This will contain the error code if the test run failed.
	 * This is used for test run level errors, not for individual test case errors.
	 */
	@Column('varchar', { nullable: true })
	errorCode: TestRunErrorCode | null;

	/**
	 * Optional details about the error that happened during the test run
	 */
	@Column(jsonColumnType, { nullable: true })
	errorDetails: IDataObject;
}
