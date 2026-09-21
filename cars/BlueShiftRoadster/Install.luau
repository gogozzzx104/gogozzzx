local Install={}
function Install.Run()
 assert(not game:GetService("RunService"):IsRunning(),"Stop playtesting before installation")
 local package=script.Parent
 local kit=game:GetService("ReplicatedStorage"):WaitForChild("KartRacingKit")
 local factory=kit:WaitForChild("KartFactory")
 assert(not kit:FindFirstChild("BlueShiftRoadster"),"BlueShiftRoadster is already installed")
 local original=factory.Source
 assert(not original:find("BlueShiftRoadster",1,true),"Factory already patched")
 local function replaceOnce(source,old,new)
  local a,b=source:find(old,1,true);assert(a,"Expected factory anchor missing: "..old)
  assert(not source:find(old,b+1,true),"Ambiguous factory anchor")
  return source:sub(1,a-1)..new..source:sub(b+1)
 end
 local modified=original
 modified=replaceOnce(modified,'name="코멧"','name="블루 시프트"')
 modified=replaceOnce(modified,'description="기본형 · 균형 잡힌 주행"','description="1인승 로드스터 · 가변식 후면 부스터"')
 modified=replaceOnce(modified,'    local attachment = Instance.new("Attachment")',[[    if definition.id=="comet" then
        require(script.Parent.BlueShiftRoadster.Body).Build(model,root,shell,seat)
    end
    local attachment = Instance.new("Attachment")]])
 modified=replaceOnce(modified,'    local exhaustActive=driving and throttle>0',[[    local concept=self.model:GetAttribute("BlueShiftRoadster")==true
    local powered=driving and throttle>0 and not self._finishCoast
    if concept then
        local full=powered and (r.boost>0 or (r.itemBoostRemaining or 0)>0 or ((r.pulse or 0)>0 and r.pulseKind=="Launch"))
        local mini=powered and (r.pulse or 0)>0 and r.pulseKind=="Mini"
        self.model:SetAttribute("RoadsterMode",full and "Full" or mini and "Mini" or "Closed")
    end
    local exhaustActive=driving and throttle>0 and not concept]])
 modified=replaceOnce(modified,'trail.Enabled=boosting;','trail.Enabled=boosting and not concept;')
 local history=Instance.new("Folder");history.Name="BlueShiftRoadster_Before_"..os.date("%Y%m%d_%H%M%S");history.Parent=game:GetService("ServerStorage")
 local backup=factory:Clone();backup.Parent=history
 require(package.Body)
 require(package.Motion)
 local p=Instance.new("Model");p.Name="BlueShiftRoadster_Preview"
 local road=workspace:FindFirstChild("PracticeRoad")
 local cf=road and road.CFrame*CFrame.new(0,road.Size.Y/2+1.3,-road.Size.Z/2+12) or CFrame.new(0,4,0)
 local root=Instance.new("Part");root.Name="Chassis";root.Size=Vector3.new(4.8,2.5,6.8);root.CFrame=cf;root.Transparency=1;root.Anchored=true;root.CanCollide=false;root.Parent=p;p.PrimaryPart=root
 local shell=Instance.new("Part");shell.Name="VisualBody";shell.Size=Vector3.new(.1,.1,.1);shell.Transparency=1;shell.CanCollide=false;shell.CFrame=cf;shell.Parent=p
 local w=Instance.new("WeldConstraint");w.Part0=root;w.Part1=shell;w.Parent=shell
 local function dummy(name,size,offset,class)
  local part=Instance.new(class or "Part");part.Name=name;part.Size=size;part.CFrame=cf*CFrame.new(offset);part.CanCollide=false;part.Massless=true;part.Parent=p
  local j=Instance.new("WeldConstraint");j.Part0=root;j.Part1=part;j.Parent=part;return part
 end
 local seat=dummy("DriverSeat",Vector3.new(2,.5,2),Vector3.new(0,.65,.45),"Seat");seat.Disabled=true
 for _,x in ipairs({-2.65,2.65}) do for _,z in ipairs({-2.1,2.1}) do dummy("Tire_"..(z<0 and "F" or "R")..(x<0 and "L" or "R"),Vector3.new(.9,2,2),Vector3.new(x,-.25,z)) end end
 require(package.Body).Build(p,root,shell,seat)
 p:ScaleTo(.82);p:SetAttribute("KartScale",.82)
 package.Parent=kit
 factory.Source=modified
 package.Client.Enabled=true
 p.Parent=workspace
 game:GetService("Selection"):Set({p})
 workspace.CurrentCamera.CFrame=CFrame.lookAt(cf.Position+Vector3.new(10,6,12),cf.Position+Vector3.new(0,.5,0))
 game:GetService("ChangeHistoryService"):SetWaypoint("Blue Shift Roadster installed")
 print("BLUE_SHIFT_INSTALLED: default Comet replaced visually; physics unchanged; local backup: "..history.Name)
 return p
end
return Install
