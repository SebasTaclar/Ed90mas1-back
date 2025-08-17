-- CreateTable
CREATE TABLE "tournament_configurations" (
    "id" SERIAL NOT NULL,
    "tournament_id" INTEGER NOT NULL,
    "number_of_groups" INTEGER NOT NULL,
    "teams_per_group" INTEGER NOT NULL,
    "is_configured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_groups" (
    "id" SERIAL NOT NULL,
    "tournament_id" INTEGER NOT NULL,
    "group_name" TEXT NOT NULL,
    "group_order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_group_assignments" (
    "id" SERIAL NOT NULL,
    "tournament_id" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "group_id" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_group_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tournament_configurations_tournament_id_key" ON "tournament_configurations"("tournament_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_group_assignments_tournament_id_team_id_key" ON "team_group_assignments"("tournament_id", "team_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_group_assignments_team_id_group_id_key" ON "team_group_assignments"("team_id", "group_id");

-- AddForeignKey
ALTER TABLE "tournament_configurations" ADD CONSTRAINT "tournament_configurations_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_groups" ADD CONSTRAINT "tournament_groups_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_group_assignments" ADD CONSTRAINT "team_group_assignments_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_group_assignments" ADD CONSTRAINT "team_group_assignments_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_group_assignments" ADD CONSTRAINT "team_group_assignments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "tournament_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
