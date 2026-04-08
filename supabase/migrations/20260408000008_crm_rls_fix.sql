-- CRM RLS Fix: Add missing policies for Pipelines, Stages, and Deals

-- 1. Pipelines
drop policy if exists "Org members can view pipelines" on pipelines;
create policy "Org members can view pipelines" on pipelines for select 
  using (exists (select 1 from org_members where org_id = pipelines.org_id and user_id = auth.uid()));

create policy "Org members can insert pipelines" on pipelines for insert
  with check (exists (select 1 from org_members where org_id = pipelines.org_id and user_id = auth.uid()));

create policy "Org members can update pipelines" on pipelines for update
  using (exists (select 1 from org_members where org_id = pipelines.org_id and user_id = auth.uid()));

create policy "Org members can delete pipelines" on pipelines for delete
  using (exists (select 1 from org_members where org_id = pipelines.org_id and user_id = auth.uid()));


-- 2. Pipeline Stages
drop policy if exists "Org members can view stages" on pipeline_stages;
create policy "Org members can view stages" on pipeline_stages for select 
  using (exists (
    select 1 from pipelines p 
    join org_members m on p.org_id = m.org_id 
    where p.id = pipeline_stages.pipeline_id and m.user_id = auth.uid()
  ));

create policy "Org members can insert stages" on pipeline_stages for insert
  with check (exists (
    select 1 from pipelines p 
    join org_members m on p.org_id = m.org_id 
    where p.id = pipeline_id and m.user_id = auth.uid()
  ));

create policy "Org members can update stages" on pipeline_stages for update
  using (exists (
    select 1 from pipelines p 
    join org_members m on p.org_id = m.org_id 
    where p.id = pipeline_stages.pipeline_id and m.user_id = auth.uid()
  ));

create policy "Org members can delete stages" on pipeline_stages for delete
  using (exists (
    select 1 from pipelines p 
    join org_members m on p.org_id = m.org_id 
    where p.id = pipeline_stages.pipeline_id and m.user_id = auth.uid()
  ));


-- 3. Deals
drop policy if exists "Org members can view deals" on deals;
create policy "Org members can view deals" on deals for select 
  using (exists (select 1 from org_members where org_id = deals.org_id and user_id = auth.uid()));

create policy "Org members can insert deals" on deals for insert
  with check (exists (select 1 from org_members where org_id = deals.org_id and user_id = auth.uid()));

create policy "Org members can update deals" on deals for update
  using (exists (select 1 from org_members where org_id = deals.org_id and user_id = auth.uid()));

create policy "Org members can delete deals" on deals for delete
  using (exists (select 1 from org_members where org_id = deals.org_id and user_id = auth.uid()));
